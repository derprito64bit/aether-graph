# CLAUDE.md

> FORK NOTE: this repo is **Aether Graph 0.5**, a precision-pencil product
> film forked from the aether-one-x-v2 film engine. The engine (timeline,
> sampler, states, director, stage, overlay, scripts) is shared architecture;
> the device (`src/components/PencilViewer/`), data (`src/data/pencil.ts`),
> copy (`src/film/chapters.ts`), teardown (`src/film/teardown/layers.ts`),
> lighting, and theme are pencil-original. Phone-era docs below (camera
> module, teardown manifest, dimensions) describe the ORIGIN repo, not this
> device — `pencilDimensions.ts` + `timeline.ts` win here.

Auto-loaded context for Claude Code. Read this first, then `docs/context.md` for the
compaction-safe session state and `docs/handoff.md` for the running log.

## Site as of 2026-10-28 (overhaul): read this before the phone-era sections

- **Routes:** `/` (film, Craft, Finishes, Buy), `/specifications`, catch-all 404. The
  phone routes (`/cameras`, `/performance`, `/display`, `/software`) and their widgets
  are gone; old URLs land on the 404. `PhoneViewer/` and `data/product.ts` stay only
  because the film engine and its tests still import them.
- **Look:** cool drafting-paper palette, one cobalt accent, Archivo (width axis) display,
  Geist body. Tokens and contrast: `docs/design-tokens.md`. The 3D stage uses the same
  paper (`src/film/lighting.ts`, `Stage.tsx`).
- **Sketch to model:** the pencil opens as an ink drawing and a cobalt render front
  sweeps it into the model. `SketchReveal.tsx`, ADR `docs/adr/sketch-reveal.md`.
- **Smooth scroll:** one Lenis instance. All programmatic scrolling goes through
  `src/scroll/smooth.ts` (`scrollToY`, `scrollToElement`). ADR `docs/adr/smooth-scroll.md`.
- **Model:** filleted lathe profiles, etched barrel wordmark (`createBarrelMaps`), knurl
  normal map with lands (`createKnurlNormalMaps`), split three-jaw collet, swept clip.
  `disposePencilMaterials` releases every map slot the set uses.
- **Shared data:** `src/data/pencil.ts` holds every figure, `CONCEPT_NOTICE`,
  `SPEC_GROUPS`, `SPEC_HIGHLIGHTS`. The drawing (`TechnicalDrawing.tsx`) is generated
  from `pencilDimensions.ts`, so it cannot disagree with the model.

New landmines from the overhaul:

- **Exploded view (2026-10-28 overhaul):** an assembly drawing, not a stack. Layout and
  envelopes are pure functions in `src/film/teardown/assembly.ts` (rows, stagger,
  sub-assemblies, feature lift and spin, camera fit), tested in `assembly.test.ts`.
  The director measures each part group once at rest, writes part transforms directly
  (no damping, so reverse scrub retraces exactly), frames the drawing from the
  measured layout, and publishes balloon anchors through `calloutBridge.balloons`.
  `AssemblyBalloons` and `BillOfMaterials` render the numbering. Every part is home by
  0.474, so x-ray and the clutch macro see the assembled pencil. Tall screens stand
  the drawing upright (`UPRIGHT_ASPECT`).
- **Scrim side:** `sideScrim` in `FilmOverlay.tsx` keys on where the copy is, not on
  `align`; the exploded act scrims from the bottom.
- **Loading page (2026-10-28):** painted from index.html before any bundle (inline CSS
  and a classic boot script exposing `window.__agl`); `src/loader/loader.ts` takes over
  from `main.tsx`. Progress is real, weighted in `src/loader/progress.ts` (unit tested):
  route files streamed with byte counts (`src/loader/assets.ts`, sizes written into
  index.html by the `aether-loading-page` plugin in `vite.config.ts`), fonts, the route
  render (`RouteReady` in App.tsx), and, only when the page opens on the film, the scene
  (`SceneReady` in FilmScene.tsx: renderer, `compileAsync`, a drawn frame). The pencil
  markup is generated from `src/components/Drawing/pencilProfile.ts`. The label moves on a
  transform (CLS); `scrollbar-gutter: stable` keeps the scroll lock shift-free. 15 s safety.
- **Chunks:** React has its own rolldown group at the highest priority. Without it the r3f
  group captured React and every page loaded all of three.js before rendering.
- **Off-screen canvases pause** (`frameloop` from IntersectionObserver in Film.tsx and
  PencilViewer.tsx). A canvas drawing below the fold starved CI's software GL.
- **Finish fan:** the final act fans the hero into steel, brass, ember (`src/film/finishFan.ts`);
  the director mirrors the hero pose onto `variantRoot`. Variants are low detail.
- **Configuration** lives at the app root (`PencilConfigProvider` in App.tsx) so the nav
  can show it. `PencilModel` register callbacks are cached: a fresh ref callback per render
  detaches and reattaches every part group.
- **Triangle budget:** `pencilBudget.test.ts` holds the high-detail pencil under 120k.
  Dense meshes (threads, knurl band) carry `userData.noEdges` so the sketch skips their
  crease lines.
- **Never dim text with opacity** for inactive states: axe fails it (finish panels did).
- **Preview ports:** other sessions run `vite preview` on 4190-4191. `--strictPort` then
  fails silently and screenshots hit the other app. Check the listener before capturing.
- **PowerShell 5.1 `Get-Content` / `Set-Content`** mangle UTF-8 (em dashes became
  mojibake in `index.html`). Use the file tools or `[IO.File]` APIs.
- `.gitattributes` forces LF; Playwright servers start through `npx` (CI is Linux).

## Deploy (GitHub Pages)

- Live at https://derprito64bit.github.io/aether-graph/. `.github/workflows/pages.yml`
  builds on every push to `main` with `BASE_PATH=/aether-graph/` and publishes `dist`.
- The base path is the deploy's only difference: `vite.config.ts` reads `BASE_PATH`
  (default `/`), so dev, `verify`, and CI e2e all run at the root.
- Every root-relative URL the app writes itself goes through `src/site.ts`
  (`withBase`, `absoluteUrl`); router links get it from `BrowserRouter basename`;
  `index.html` uses `%BASE_URL%`. A new hard-coded `/path` will 404 on Pages.
- No SPA rewrites on Pages: `scripts/pages-fallback.mjs` copies `index.html` to
  `404.html` (unknown paths render the site's 404) and to `<route>.html` for each real
  route (add new routes to its `ROUTES` list, and to `public/sitemap.xml`).

---

## What this is

**Aether One X v2** — a scroll-driven 3D product film site for a **fictional** flagship
phone. React 19 + TypeScript + Vite 8 + Tailwind v4 + three/R3F. The homepage is one
continuous camera shot across 11 acts driven by a single `scrollYProgress` MotionValue.

Two repos, and they are not the same thing:

- **Build repo** (this one): `C:\Users\Aaron\aether-one-x-v2`, git `master`.
- **Deploy repo**: `C:\Users\Aaron\Documents\GitHub\muse-spark-testing`, git `main`,
  GitHub `derprito64bit/muse-spark-testing`, Vercel Hobby auto-deploys.

**Sync ritual:** work in the build repo, then copy across excluding `.git`,
`node_modules`, `dist`, `reference`, `test-results`, `playwright-report`,
`.playwright-mcp`. Commit both. Push deploy.

---

## Commands

Windows PowerShell. The `.ps1` shims are blocked by execution policy, so **always use
`npm.cmd` and `npx.cmd`.**

```
npm.cmd run dev        vite, port 5173
npm.cmd run verify     typecheck + lint + format + test + build + analyze
npm.cmd run e2e:quick  chromium smoke + film (local loop)
npm.cmd run e2e        full matrix (prefer CI)
node scripts/m3r-shots.mjs      9 device views (primary visual check)
node scripts/capture-film.mjs   act snapshots into docs/film-snaps/
```

`npm run verify` must be green before any milestone is called done. Always `build`
before `e2e`.

---

## DESIGN AUTHORITY — read this before touching the camera

**The camera module is CIRCULAR.** Verified in `src/components/PhoneViewer/phoneDimensions.ts`:
`MODULE`, `COLLAR`, `LENS_RING_R = 0.0102`, `LENSES`, `PERISCOPE`, `TOF`, `MEDALLION`,
`MODULE_MIC`. There is no `ISLAND` constant. The offset two-tier plateau is gone.

**`docs/handoff.md` decision D7 is STALE.** It says the dial/circular camera was retired
in favour of the plateau. That was true on 2026-09-20 and was reversed when the circular
module spec landed. The same applies to the "Prompt authority" paragraph near the top of
`docs/context.md`. The "Dimensions" section further down that same file is correct.

**When docs and code disagree, the code wins.** Check `phoneDimensions.ts` and
`src/film/timeline.ts` first, then fix the stale doc in the same commit.

Current module: centred at `(0, 0.0458)`, `outerR 0.0235`, double-step collar, three
round lenses on a triangle at polar `R = 0.0102` (main `r.0060 @90°`, ultra `r.0049 @210°`,
mid `r.0049 @330°`), rectangular periscope below, arc flash, ToF emitter/receiver pair,
module mic, six-blade iris medallion inlaid under the cover glass, knurled collar.
`BODY_N = 6.0`.

---

## Timeline

Eleven acts. `xray`, `chip`, and `rebuild` were replaced by a single `teardown` act
occupying the same span, so no downstream boundary moved.

```
arrival 0–0.10   settle 0.10–0.155   approach 0.155–0.25
teardown 0.25–0.52        <- the horizontal layer-by-layer sequence
camera 0.52–0.72   display 0.72–0.84   storage 0.84–0.89
battery 0.89–0.93  software 0.93–0.95  ai 0.95–0.975  final 0.975–1
```

Teardown has ten layers in physical stack order, front to back: `cover-glass`, `display`,
`midframe`, `battery`, `logic-board`, `silicon`, `thermal`, `power-coil`, `camera`,
`rear-panel`. The battery sits in front of the logic board; that is correct, not a bug.

Pacing is controlled by `--film-height` in `src/index.css`, **not** by moving act
boundaries. Every boundary is a fraction, so changing the runway rescales everything
without touching the timeline.

---

## Architecture

```
src/lib/          pure math, no React, no three. All unit tested.
                  superellipse, battery, progress (branded 0..1), format
src/film/         the homepage film
  key.ts          FilmKey authoring API + smoothstep
  timeline.ts     ACTS + composed KEYS
  acts/*.ts       one file per act, object-literal keyframes
  sample.ts       zero-alloc sampler, re-clocked Catmull-Rom
  framing.ts      fit-based responsive FOV solver
  states.ts       computeFilmStates(p) -> scratch object of scalars
  shots.ts        per-act shot profile + velocity caps
  lighting.ts     per-act studio state + stage colour
  FilmDirector    the single useFrame that writes everything
  stage/          cyclorama, floor, stageColors
  teardown/       layers.ts manifest
  internals/      layout.ts (component manifest), explode.ts (registry),
                  parts/ (board, silicon, power, optics)
  overlay/        chapters copy, primitives, Callouts
src/components/PhoneViewer/   the device: dimensions, geometry, materials,
                  textures, finishes, environment, CameraAssembly
src/zoom/         zoom module math
```

---

## Invariants — do not violate

1. **Everything in the film is a pure function of scroll progress.** No time-based
   animation, or scrubbing backward desyncs. Screw rotation is `explode × 2π`, never an
   accumulating angle.
2. **Scroll values never enter React state.** MotionValues and refs only. No
   `window.addEventListener('scroll')` anywhere.
3. **Zero allocation in `useFrame`.** Reuse scratch objects. `computeFilmStates` returns
   one shared object by design.
4. **Materials are transparent from birth** so the dissolve never triggers a mid-film
   shader recompile.
5. **Dispose everything.** If you add a map slot (`normalMap`, `anisotropyMap`,
   `clearcoatNormalMap`, `sheenColorMap`), extend the disposal walk in the same commit.
6. **No drei imports in app code.** 900KB of lazy bloat. Custom geometry instead (D3).
7. **Motion, not GSAP.** Single animation runtime (D1). The GSAP MCP is installed and
   deliberately unused.
8. **The device is fictional.** No real manufacturer's wordmark, logo, letterform, or
   product design. The optics partner and its medallion are original. This is a merge
   gate, see `docs/device-originality.md`.
9. **Zero third-party runtime requests.** Enforced by `src/lib/no-network.test.ts`.

---

## Landmines

Full list in `docs/context.md`. The ones that cost the most time:

- **`SHELL_MATS` / `FRAME_MATS` in `FilmDirector.tsx`.** Every new device material key
  must be added or the part stays solid through the teardown. The inverse also bites: the
  subpixel macro overlay was in `SHELL_MATS` and got pinned opaque, washing every face
  grey. That was the single biggest visual bug of the project.
- **Earcut drops dense holes in superellipse extrudes.** The ring is an explicit annulus.
  `ringHole.test.ts` guards it. Annulus loops must start at `+X` with monotone winding or
  the lid pinwheels.
- **R3F `aria-label` on `<group>` throws on re-render.** Use `name`.
- **Parallax must not accumulate inside the damped aim.** Apply it at `lookAt`.
- **`?t=` captures land short** because of layout shift. `m3r-shots.mjs` re-scrolls after
  settle. Multi-viewer pages poison `window.__` probes.
- **Axe must run after entrance motion settles** (600ms) plus `fonts.ready`.
- **CLS tests:** no `buffered: true`; wait for the lazy chunk and fonts first.
- **`react` / `react-dom` pinned to exactly 19.2.8.** Fiber caps below 19.3.
- **Vite 8 uses `build.rolldownOptions.output.advancedChunks`.** The `rollupOptions` alias
  is silently ignored (D2).
- **PowerShell:** no heredocs, no `||`, and `>` corrupts binaries as UTF-16. Never use the
  shell for file operations; use the file tools.

---

## Verification

1. `npm.cmd run verify`.
2. `node scripts/m3r-shots.mjs` for the 9 device views.
3. **The reverse scrub.** Drag from 1.0 back to 0.0 slowly. Nothing pops, no part
   teleports. This catches more than every other check combined.
4. **Grayscale test** for any material work: force albedo to mid-grey. If the subject
   flattens, the lighting is doing no work and materials will not rescue it.
5. Re-capture snapshots and review diffs by eye before committing them.

GPU here is an RTX 3070 with a Ryzen 5600X, so real traces are meaningful. SwiftShader
appears only in headless runs and gives lower bounds, not real numbers.

---

## Blender

Live link via the `blender` MCP. Blender 4.5.14 LTS (Steam) + MCP-for-Blender addon v1.7,
protocol 9. Auto-start flag is saved in the .blend; if it does not reconnect, use the
N-panel, BlenderMCP tab, Start MCP Server.

Scene file: `%LOCALAPPDATA%\Temp\opencode\aether-one-x.blend`

Lessons that will otherwise cost an hour each: 2D-curve slabs render uncapped, use a
bmesh loft; the body needs dark caps under the cover glass; a big flat-on area light blows
obsidian to white, so use dim raking light; bmesh has no `create_torus`, hand-roll a
parametric one; transmission glass over bright lights blows out, so darken the lens base;
`execute_blender_code` is stateless, redefine helpers every call.

---

## Moving from opencode to Claude Code

- **MCP servers already work.** `.mcp.json` carries chrome-devtools, playwright, context7,
  blender, and gsap. On first run they show "Pending approval" — run `claude` in the
  project and approve each. `opencode.json` can stay; it is ignored here.
- **The `dataviz` skill is NOT available to Claude Code yet.** It was installed for
  opencode at `~/.config/opencode/skills/dataviz/`. Copy that folder to
  `.claude/skills/dataviz/` in this repo so it is version-controlled and loads here. Load
  it before writing any chart, meter, or KPI code.
- **Context7 resolves drei as `/pmndrs/drei`**, not the npm package name.
- Prompt specs live in `docs/`: `meta-prompt-main.md`, `m3r-device-model.md`,
  `prompt-a-fidelity.md`, `prompt-b-animation.md`, plus the newer circular-module,
  internals, and teardown briefs in `Claude outputs/`.

---

## Honest gaps

Real-GPU traces still outstanding. Reduced-motion e2e coverage is thin. Rack-focus DOF is
deferred pending measurement (`focusPull` and `macroAtmos` are wired to accent and sensor
shimmer as the no-DOF path). `sectionCut` is reserved and unused. Callouts show only one
or two labels at a time by the collision rule. LOD2 and the merged shell are deferred with
reasons recorded in `docs/device-design.md`. Lighthouse CI runs in CI but has not been
exercised locally.
