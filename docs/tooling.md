# Tooling record — aether-one-x-v2

Setup run on **Sat Sep 19 2026** from `C:\Users\Aaron` (Windows 11 build 26200, x64, PowerShell 5.1).
This is a **toolchain setup only**. No application code was written.

## 1. Environment report

| Tool                       | Version                                                        | Required?                                                     |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| Node                       | v24.18.0                                                       | ✅ ≥24                                                        |
| npm                        | 11.16.0                                                        | ✅ ≥10 (use `npm.cmd`; `npm.ps1` blocked by execution policy) |
| git                        | 2.55.0.windows.2                                               | ✅                                                            |
| gh                         | 2.97.0                                                         | ✅ (only if pushing to GitHub)                                |
| uv / uvx                   | 0.11.16                                                        | ✅ (needed for Blender MCP)                                   |
| Python                     | 3.14.5                                                         | ✅                                                            |
| Chrome                     | `C:\Program Files\Google\Chrome\Application\chrome.exe`        | ✅                                                            |
| Edge                       | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` | ✅ present as fallback                                        |
| Blender                    | `C:\Program Files\Blender Foundation\Blender 5.0\blender.exe`  | present; not on PATH                                          |
| `PLAYWRIGHT_BROWSERS_PATH` | not set                                                        | browsers will use Playwright's default download               |
| claude CLI                 | 2.1.251                                                        | present at `C:\Users\Aaron\.local\bin\claude.exe`             |

**Note:** `npm.ps1` / `npx.ps1` are blocked by the PowerShell execution policy
("running scripts is disabled"). The `.cmd` equivalents work. This is cosmetic but
will affect any tooling invoked as `npm`/`npx` from within PowerShell.

## 2. MCP servers installed (project scope, `.mcp.json` in repo root)

| Server            | Package / URL                               | Verified?                                                                                               |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `chrome-devtools` | `npx -y chrome-devtools-mcp@latest` (1.9.0) | ✅ real call: connected, 29 tools listed                                                                |
| `playwright`      | `npx -y @playwright/mcp@latest` (0.0.82)    | ✅ real call: connected, 25 tools; screenshot taken                                                     |
| `context7`        | `https://mcp.context7.com/mcp` (HTTP)       | ✅ real lookup: resolved `/pmndrs/drei`, returned current `MeshTransmissionMaterial` props              |
| `blender`         | `uvx blender-mcp` (1.0.1)                   | ✅ server responds (`BlenderMCP` v1.30.0). Runs as Blender's MCP server; needs Blender open per session |
| `gsap`            | `npx -y @vinhnguyen/gsap-mcp@1.1.2`         | ✅ connected, 6 tools (only if GSAP chosen over Motion)                                                 |

`claude mcp list` health checks: `playwright` shows **Connected**; `chrome-devtools`,
`context7`, `blender`, `gsap` show **Pending approval — run `claude` to approve**.
Run `claude` once in the project and approve each server.

Blender addon: `uvx blender-mcp install-addon` wrote the addon to
`%APPDATA%\Blender Foundation\Blender\5.1\scripts\addons\blender_mcp.py`
(the printed success line crashed on a cp1252 Unicode arrow, but the file landed;
addon on disk is current, protocol 7). The matching Blender binary installed is 5.0 —
**confirm the addon is enabled in the 5.0/5.1 instance that will be used.**

## 3. Verification harness

`scripts/mcp-check.mjs` — tiny stdio/HTTP MCP probe (initialize + tools/list).
Usage: `node scripts/mcp-check.mjs npx <pkg>` or `node scripts/mcp-check.mjs http <url>`.

## 4. Skills inventory

Present on disk: the standard Claude Code + opencode skill sets (design, ui-ux-pro-max,
frontend-design, slides, skill-creator, math-olympiad, etc. — see `~/.claude/skills` and
`~/.config/opencode/skills`).

- **Already enabled and ready:** the full local skill set in the session; `skill-creator` is present.
- **Missing and needed for this build:** **`dataviz`** — not present anywhere.
  Enable it in the Claude app's settings under **Skills**.
- **Not present / not needed for now:** `artifact-design`, `artifact-diagramming`
  (only for hosted Artifacts / README SVG), `cowork-plugin` (only for team plugin bundling),
  `claude-in-chrome` (only if driving the real Chrome; a `~/.claude/chrome` native-host
  stub exists but no skill), `pptx`/`docx`/`pdf`/`xlsx` (only if a deliverable in that format).

## 5. Deliberately skipped / failed

- **Vercel / Netlify (Tier B):** skipped by choice — not deploying yet. Add later with
  `claude mcp add vercel -s project --transport http https://mcp.vercel.com` + OAuth.
- **Rive MCP (`@rive-mcp/server-core@0.1.0`):** installed then **removed**. The published
  npm tarball's `bin` points at `dist/cli.js` which does not exist in the package
  (`'rive-mcp-server' is not recognized`), and the source is a placeholder
  ("Future implementation will go here"). Reinstall only if a fixed release ships.
- **MotionLoom:** `npx --yes motionloom setup` is **blocked** — requires a `package.json`
  at the project root ("BLOCK package.json is missing"). This is expected: setup does NOT
  scaffold app code. Re-run `npx --yes motionloom setup` after the build creates the Vite app.
- **Figma MCP:** not CLI-installable; it must be connected from the Claude connector
  directory (Settings → Connectors). Needs a Figma account/plan. Not done — requires human.
- **GitHub MCP:** not installed by design (no first-party connector; use `git` + `gh`).
- **`motion-mcp`:** noted, not installed (no adoption yet).

## 6. Still blocked on a human action

1. **Approve MCP servers:** run `claude` in this project and approve
   `chrome-devtools`, `context7`, `blender`, `gsap` (playwright already connected).
2. **Enable the `dataviz` skill** in Claude app settings under Skills.
3. **Blender:** not on PATH; addon written to the 5.1 config dir while a 5.0 binary is
   installed — verify which Blender version will be driven, then open it and start the
   addon server (sidebar → server) each session it is used.
4. **Figma MCP** (if needed): connect in Settings → Connectors.
5. **Vercel/Netlify** (if deploying): add and complete OAuth.

## 7. opencode setup (chosen over the claude CLI)

On **Sat Sep 19 2026** the MCP servers were re-wired for **opencode** (project-scoped
`opencode.json`), not the `claude` CLI:

- `chrome-devtools` → `npx -y chrome-devtools-mcp@latest` (local)
- `playwright` → `npx -y @playwright/mcp@latest` (local)
- `context7` → `https://mcp.context7.com/mcp` (remote)
- `blender` → `uvx blender-mcp` (local)
- `gsap` → `npx -y @vinhnguyen/gsap-mcp@1.1.2` (local)

The **`dataviz` skill** was installed for opencode at
`~/.config/opencode/skills/dataviz/` (SKILL.md + references/ + scripts/ from the
Claude Code bundled-skills mirror, `name:` fixed to `dataviz`). Validator verified:
`node scripts/validate_palette.js "<hex,…>" --mode light` runs and passes.

No claude CLI approval flow is needed — opencode launches the servers from config on
startup. Restart opencode to load `opencode.json` and the new skill.

## 8. Known gaps to tell the build agent about

- Use `npm.cmd` / `npx.cmd` (execution policy blocks the `.ps1` shims).
- `PLAYWRIGHT_BROWSERS_PATH` not set; first Playwright browser launch may trigger a download
  (approve it), or set the path to an existing Chrome instead.
- Rive MCP is unusable (broken package) — don't plan around it.
- MotionLoom needs a re-run of `npx --yes motionloom setup` once `package.json` exists.
- `dataviz` skill must be enabled by the human before chart work starts.
- Docs source of truth: Context7 resolved `@react-three/drei` → library ID `/pmndrs/drei`,
  not the npm package name pattern used in some generation prompts.
