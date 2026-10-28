# Design tokens: Aether Graph 0.5

Source of truth: `src/index.css` under `@theme`. No raw hex in components.

## Direction

A drafting-film studio. The graphite instrument reads as ink on a cool,
neutral technical paper; one accent only, drafting cobalt, which is the
complement of the brass clutch, so the mechanism is the only warm thing on
the page. The same paper carries through the 3D stage (`src/film/lighting.ts`
stage colours, `src/film/stage/Stage.tsx` lower room and floor) so the film
and the HTML read as one sheet.

## Surfaces

| Token     | Value     | Use                               |
| --------- | --------- | --------------------------------- |
| `night`   | `#ecede9` | page background, drawing paper    |
| `surface` | `#e3e4e0` | viewer panels, selected controls  |
| `elev`    | `#d8dad5` | hover fills                       |
| `raise`   | `#cdd0ca` | hairline-adjacent fills           |
| `rule`    | `#b9bcb6` | ruler ticks, ghost-button borders |

## Ink and accent

| Token           | Value     | Use                                       |
| --------------- | --------- | ----------------------------------------- |
| `ink`           | `#111316` | headlines, body on paper                  |
| `dim`           | `#4b5057` | secondary copy                            |
| `faint`         | `#5f646b` | technical figures (`.spec-tech`)          |
| `aether`        | `#2a44c2` | kicker leaders, dimension lines, progress |
| `aether-strong` | `#2f4bd6` | primary buttons                           |
| `aether-deep`   | `#1d2f8c` | dimension labels, figures in cobalt       |
| `on-accent`     | `#f5f6f3` | text on cobalt                            |

## Contrast (measured 2026-10-28, WCAG relative luminance)

| Foreground    | Background      | Ratio   | Requirement     | Result |
| ------------- | --------------- | ------- | --------------- | ------ |
| `ink`         | `night`         | 15.82:1 | 7:1 primary     | pass   |
| `dim`         | `night`         | 6.91:1  | 4.5:1 secondary | pass   |
| `faint`       | `night`         | 5.07:1  | 4.5:1           | pass   |
| `aether`      | `night`         | 6.60:1  | 4.5:1           | pass   |
| `aether-deep` | `night`         | 9.72:1  | 4.5:1           | pass   |
| `on-accent`   | `aether-strong` | 6.25:1  | 4.5:1 buttons   | pass   |
| `ink`         | `surface`       | 14.57:1 | 7:1             | pass   |
| `dim`         | `surface`       | 6.36:1  | 4.5:1           | pass   |
| `faint`       | `surface`       | 4.67:1  | 4.5:1           | pass   |

`faint` on `elev` is 4.23:1, so `faint` text never sits on `elev`. Nothing
on the page is dimmed with opacity to show an inactive state (axe judges the
steady state); inactive states change colour token or carry a cobalt rule.

## Type

- Display: Archivo Variable, `wdth` axis (`@fontsource-variable/archivo/wdth.css`).
  Headlines at 100% width, weight 600, tracking -0.035em (`.spec-num`,
  sized by `.display-xl` / `.display-lg` / `.display-md`). Spec numerals at
  125% width, weight 300 (`.spec-num--stat`, `.numeral`), tabular lining.
- Sans: Geist Variable (body, UI). Mono: Geist Mono Variable.
- `.kicker`: mono, sentence case, cobalt leader rule. Film chapters and
  sparingly elsewhere, never above every section.
- `.spec-tech`, `.spec-unit`: mono, sentence case, tabular.
- No em dashes in visible copy.

## Shape

Full pill for every interactive control (`.btn`, segmented control),
8px (`rounded-lg`) for panels and option tiles, round swatches.

## Motion

- Easings: `--ease-out-expo` (entrances), `--ease-out-quint` (UI state).
- Film chapters: words rise from a mask, 45ms stagger, 720ms; exits 200ms.
- Smooth scroll: Lenis, one instance (`src/scroll/smooth.ts`, ADR
  `docs/adr/smooth-scroll.md`). Off under reduced motion.
- Sketch to model: `docs/adr/sketch-reveal.md`.
- `prefers-reduced-motion` is a layout, not a kill switch: the film becomes
  the static story, Craft lays its three beats out in full.

## Glass tokens

`--glass-tint`, `--glass-blur` (18px), `--glass-saturate` (140%),
`--glass-rim`, `--glass-scrim`. Variants read these, never their own numbers.
Full tier system in `docs/glass.md`.
