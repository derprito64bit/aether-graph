# Aether Graph 0.5: a prompting and design capability test

**Live:** https://derprito64bit.github.io/aether-graph-prompting-design-test/

This repository tests how far a coding agent can take a product website when a
person directs it only with short, plain-language prompts. The product is
fictional: the Aether Graph 0.5, a precision drafting pencil. The 3D model, its
textures, the technical drawings and the hand lettering are all generated in
code. There are no 3D model files or photographs; the only outside assets are
three open-source variable fonts and an icon set, and the site serves them
itself, so it makes no third-party requests.

The site went from a mediocre first build to what you see now in five pull
requests and twelve prompts, all quoted below. The rest of this README explains
how.

> All specifications and prices are illustrative. Nothing here is for sale. The
> device, brand and copy are original fiction.

## What you'll see

- **A loading page where the pencil is the progress bar.** An ink drawing of the
  pencil fills with its rendered materials as the site really loads: the bytes
  of the 3D engine, the fonts, the shader compile. It never goes backwards and
  ends at exactly 100.
- **A scroll-driven film.** The pencil opens as an ink sketch, and a cobalt
  render front sweeps it into a real-time 3D model. Seven acts follow: the
  knurled grip, an exploded assembly drawing with numbered balloons and a parts
  list, an x-ray of the mechanism, a macro of the three-jaw brass clutch, the
  reassembly, and a fan of the four finishes.
- **The film is an annotated drawing.** Margin notes are lettered by hand as you
  scroll, with leaders to the exact parts they name, and are erased as each act
  ends. Scroll back and they un-write. A sheet border, zone marks and a sheet tag
  frame every act.
- **Autoplay.** "Watch the film" plays the whole page: each act held where its
  notes are finished, the ten parts of the exploded view one at a time, then the
  design beats, the finishes and the purchase. Any scroll, touch or key hands
  control back.
- **Drafting paper everywhere else.** A non-repro blue grid, pencil-drawn frames
  and rules, a technical drawing generated from the same dimensions as the 3D
  model, a footer laid out as a drawing title block, and section titles that rule
  their guide lines, letter themselves and erase the guides.
- **A configurator with weight.** Choosing a finish pops its tile out and spins
  the 3D pencil once while the new finish swaps in; the nav shows the
  configuration and its price.

## How it was made

### The starting point

The repository started on 22 and 23 September 2026 as a pencil product film
built by another AI model (Muse Spark), on a film engine forked from an earlier
phone site. It worked, but it looked generic: a plain studio scene, a simple
pencil, a stacked exploded view, and continuous integration that had never
passed.

From 28 October the site was rebuilt by
[Claude Code](https://claude.com/claude-code) (Claude Opus 5.5), running as a
background agent with the repository, a shell, a real GPU for screenshots, and
GitHub. The person directing it wrote every prompt below and changed no code.

### The prompts

Quoted exactly, typos included. They are the whole of the human direction. The
design concept, the architecture, the copy and the tests were the agent's.

| #   | Prompt                                                                                                                                                                                                                                                                                                                                            | Became    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | "looking at the https://github.com/derprito64bit/aether-graph project find the project files and do a complete overhaul in improvements for the website, muse has done a rather mediocore job since it isn't really good at web design, use any skills libraries, motion libraries, etc that will be useful such as animejs, manus, threejs, etc" | PR #1     |
| 2   | "also fix up playwright if there is any issues with it"                                                                                                                                                                                                                                                                                           | PR #1     |
| 3   | "also you may have to remodel some things due to how visually undetailed some things are i want it to be very nicely detailed and also add the effect of the pen sketch turning into the actual model itself"                                                                                                                                     | PR #1     |
| 4   | "is everything done?"                                                                                                                                                                                                                                                                                                                             | (status)  |
| 5   | "create the public pages for me"                                                                                                                                                                                                                                                                                                                  | PR #2     |
| 6   | "is it up yet?"                                                                                                                                                                                                                                                                                                                                   | (status)  |
| 7   | "can you improve the exploding view i dont like how it's made just make a completely overhauled exploding view varient also make details and components more detailed"                                                                                                                                                                            | PR #3     |
| 8   | "have a proper loading page that shows progress with the pen model as the percentage bar"                                                                                                                                                                                                                                                         | PR #4     |
| 9   | "do an overview of small but satisfying details and animations to add in"                                                                                                                                                                                                                                                                         | PR #4     |
| 10  | "also add an animation that shows the different varients of the pen and the buy selection should also be fancy where it pops out or something like that"                                                                                                                                                                                          | PR #4     |
| 11  | "okay now do any overall polish in the website such as backgrounds, lighting, display, animation, auto scrolling for animated parts, filling in space with text, having custom font animations as if it's being written, having animations and sections being pencil etched etc"                                                                  | PR #5     |
| 12  | "okay now change the github name and description as a prompting and design capability test and explain in detail how it was done to this level"                                                                                                                                                                                                   | this page |

What each pull request delivered:

- **#1, the overhaul** (+3,916 / −2,030 lines). A new design system, a
  remodelled procedural pencil (filleted lathe profiles, an etched wordmark, a
  knurl normal map, a split three-jaw collet, a swept clip), the sketch-to-model
  reveal, the Craft, Finishes and Buy sections, the specifications page, smooth
  scrolling, a rewritten end-to-end suite and the first green CI.
- **#2, the public site** (+128 / −10). GitHub Pages under a base path, with
  real files for every route so deep links and the 404 page work without a
  server.
- **#3, the exploded view** (+1,744 / −2,773). An assembly drawing in place of a
  stack: two rows, staggered parts, sub-assemblies, each part lifting and turning
  in turn, numbered balloons and a parts list, and more detail in every part
  (threads, bores, a 3D knurl, the clutch spring, spare leads).
- **#4, loading, variants and details** (+2,028 / −220). The pencil loading
  page, the finish fan, the configurator's pop, count-ups, drawn dimension lines,
  balloon pops, and two performance fixes found on the way (below).
- **#5, the drawing sheet** (+2,746 / −119). The hand-lettering alphabet,
  lettered titles, margin notes, sheet furniture, drafting paper, pencil-drawn
  sections, 3D floor and lighting, and autoplay.

### Why short prompts were enough

The prompts say what, never how. Eight habits made that sufficient.

**1. The agent works from durable context, not just the prompt.** The
repository's [CLAUDE.md](CLAUDE.md) holds the project's invariants and its
landmines: things that cost hours once and must not happen again. The user's
standing instructions set the bar (quality first, verify before claiming done,
full git permissions). Each stage added what it learned to CLAUDE.md, so the
next stage started further ahead.

**2. Every request became a design idea before any code.** "Polish the
backgrounds, lighting, text…" could have become a list of effects. Instead the
agent first captured every section on a real GPU and found what was weak: half
of each film frame empty, flat paper, no shadow under the pencil, entrances that
only faded. Then it chose one concept that answered all of it. The product is a
drafting pencil, so the site is a drawing made with it. The grid, the guide
lines, the margin notes, the title block and the loading page's dimension scale
all come from that one idea, which is why they read as one piece of work rather
than a collection of tricks.

**3. One source of truth.** Every figure on the site (length, tolerances,
prices) comes from [`src/data/pencil.ts`](src/data/pencil.ts). The technical
drawing and the loading-page pencil are generated from the same dimensions as
the 3D model. The margin notes, the specifications table and the film captions
cannot disagree, because none of them holds its own numbers.

**4. It looks at its own work.** After each change the agent built the site,
captured every film act and section on the GPU at desktop and phone sizes,
packed the shots into contact sheets and reviewed them. Many fixes came from
looking: a leader running out of frame in a close-up, a colon too small to read
at 9 px, a title block overflowing at tablet width.

**5. It proves its work.**

- `npm run verify` (types, lint, format, 167 unit tests, build, bundle budgets)
  must pass before anything ships. The tricky logic lives in small pure functions
  with tests: the lettering layout, the note windows, the autoplay tour, the
  loading progress model, the assembly layout.
- 85 end-to-end tests run across Chromium, Firefox, WebKit and a phone profile,
  with axe accessibility checks.
- Targeted probes cover what tests can't easily show: a throttled-network
  capture of the loading page (real bytes, never backwards, ends at 100), a
  reverse scrub proving the notes un-write exactly, and a software-renderer probe
  counting shader compiles.

**6. A second pair of eyes at every stage.** Each pull request was reviewed by a
separate agent given only the diff and the project's rules, not the author's
reasoning, so its reading wasn't anchored. Every finding was fixed before merge.
In the last pull request there were 13, mostly edge cases in autoplay: keys
ignored while focus sat on its own button, a hidden tab making the page jump
ahead, focus lost on Stop.

**7. Root causes, not retries.** When CI started failing intermittently, the
agent didn't re-run it until it went green. It pulled the trace, replayed the
failing step under a software renderer and found that every finish change
recompiled all of the pencil's shaders, which real visitors would also have felt
as a freeze. Similar digging found React bundled with the 3D engine (so every
page downloaded three.js) and development-only pages shipping to production.

**8. It ships like a team.** Each stage gets its own branch and a pull request
with a written description. CI runs on both the push and the pull request, and
a merge happens only when both runs are clean. The Pages deploy is watched, and
checks run against the live site.

### Under the hood: the signature pieces

- **Sketch to model.** The pencil's materials are patched to discard everything
  above a front moving along the pencil's axis, with a cobalt glow at the edge;
  ink hull and crease-line layers draw the sketch beneath it. The front is a pure
  function of scroll.
  ([`SketchReveal.tsx`](src/components/PencilViewer/SketchReveal.tsx))
- **A loading page that measures.** The page is painted from `index.html` before
  any JavaScript runs, so it appears at once. A build plugin writes the exact
  size of each route's files into the page; the loader streams them and counts
  real bytes, then waits on the fonts, the first render and, on the film, the
  shader compile and a drawn frame. Weighted tasks combine into one number that
  never goes backwards. ([`src/loader/`](src/loader/))
- **The assembly drawing.** The exploded layout is a pure function of scroll,
  measured from the real part geometry, so scrolling back retraces it exactly.
  ([`assembly.ts`](src/film/teardown/assembly.ts))
- **Hand lettering.** An original single-stroke alphabet in the manner of
  ISO 3098 drafting capitals, each glyph's strokes stored in the order a hand
  writes them. A layout step turns text into strokes with start and end times;
  each stroke is drawn with a dash offset, following scroll or playing once.
  Each letter sits a hair off its ideal place, the same way every time, as a
  hand would set it. ([`src/components/Lettering/`](src/components/Lettering/))
- **Notes that point at real parts.** At the end of every frame the 3D director
  writes named anchor points (the grip, the clutch, the crown of each finish
  card) into a shared bridge; the notes layer projects them to the screen and
  draws a draftsman's leader to each. ([`notes.ts`](src/film/notes.ts),
  [`FilmNotes.tsx`](src/film/overlay/FilmNotes.tsx))
- **Autoplay.** A pure tour (stops, travel time on a smootherstep curve, holds)
  drives the real scroll position, so every scroll-driven effect plays exactly as
  it would by hand. Its clock advances at most 50 ms per frame, a resize
  re-measures the tour, and any input ends it. ([`tour.ts`](src/scroll/tour.ts),
  [`autopilot.ts`](src/scroll/autopilot.ts))

The rules that held throughout: the film is a pure function of scroll; scroll
values never enter React state; nothing allocates inside the frame loop; one
animation library (Motion); no third-party requests, enforced by a test.

### By the numbers

- 12 prompts, 5 pull requests, about 10,600 lines added and 5,150 removed.
- About 11,800 lines of TypeScript in `src`, not counting the phone-era engine
  leftovers.
- 167 unit tests in 36 files; 85 end-to-end tests across four browser profiles.
- The site's own JavaScript stays inside a 180 KB (gzip) budget; three.js loads
  separately, and only on pages that show 3D.

### What the human did, and the limits

The person wrote the prompts, decided what to ask for next and judged the
results. The agent asked no design questions in this run: the palette, the type,
the drawing-sheet concept and the copy were its own choices.

Limits worth knowing: the product, its figures and its prices are fictional. The
3D model is procedural code, not a sculpted or scanned asset. CI renders WebGL in
software, so performance numbers there are lower bounds. The site hasn't been
tested on physical phones.

## Running it

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | local dev server                                              |
| `npm run verify`    | typecheck + lint + format + test + build + analyze (the gate) |
| `npm run test`      | vitest unit suite                                             |
| `npm run e2e`       | Playwright matrix (CI)                                        |
| `npm run e2e:quick` | Chromium smoke + film (local loop)                            |
| `npm run build`     | production bundle                                             |
| `npm run analyze`   | bundle budgets (fails when exceeded)                          |

On Windows use `npm.cmd` / `npx.cmd`; the PowerShell `.ps1` shims are blocked by
execution policy. The live site redeploys from `main` through
`.github/workflows/pages.yml`.

## Routes

`/` (the film, then Craft, Finishes and the purchase deck) and
`/specifications`; anything else is a 404. `?t=` deep-links film progress (`?t=0`
opens on the sketch) and `?nogl=1` forces the static story. Development builds
also serve `/dev/zoom` and `/dev/kitchen-sink`; production builds leave them out.

## Architecture

```text
scroll ──► progress MV ──► sampleFilm(p) ──► FilmDirector ──► scene
                                │                  ├─ camera/pose/FOV (damped + capped)
                                │                  ├─ lighting states (damped per act)
                                │                  ├─ shell dissolve + assembly layout
                                │                  └─ note and balloon anchors
                                └─► computeFilmStates(p), noteWritten(p) ──► overlay:
                                    chapters, margin notes, balloons, sheet
```

- `src/film/`: acts (keyframes), timeline, sampler, states, director, overlay,
  teardown, margin notes.
- `src/components/PencilViewer/`: the procedural pencil (geometry, materials,
  textures, sketch reveal, viewer).
- `src/components/Lettering/` and `src/components/Sketch/`: the hand lettering
  and the pencil-drawn frames and rules.
- `src/components/Drawing/`: the technical drawing, generated from
  `pencilDimensions.ts`.
- `src/loader/`: the loading page's progress model and asset streaming.
- `src/scroll/`: smooth scrolling and the autoplay tour.
- `src/data/pencil.ts`: the single source of truth for every figure, price and
  spec row.

## Constraints

- Fictional product; no real brand is imitated anywhere.
- No analytics, fonts, images or beacons fetched from anywhere else (tested).
- ACES Filmic tone mapping, one curve; colours authored in sRGB and converted
  once (`docs/rendering.md`).
- A 120k-triangle budget for the pencil; bundle budgets enforced
  (`docs/perf.md`).
- Accessibility: a skip link, arrow-key act navigation, live chapter
  announcements, a static story under reduced motion, contrast-tested colours.

## Docs

[`CLAUDE.md`](CLAUDE.md) (the agent's working notes and landmines),
`docs/FILM.md` (add an act), `docs/design-tokens.md` (colour and contrast),
`docs/motion.md` (motion grammar), `docs/rendering.md` (colour pipeline),
`docs/adr/` (big decisions), `docs/tooling.md` (environment).
