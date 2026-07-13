# Quality, deployment, and roadmap

## Goal

Verify graph correctness, browser behavior, credential boundaries, static delivery, and scale before declaring the viewer production-ready. The repository's native issue dependencies define implementation order; this plan defines the evidence required to close each delivery gate.

## Local command contract

| Command | Responsibility |
| --- | --- |
| `bun install` | Install exact locked dependencies |
| `bun run dev` | Run the local Vite development server |
| `bun run check:fix` | Apply safe formatting and lint fixes |
| `bun run check` | Verify formatting, linting, and TypeScript |
| `bun run typecheck` | Run strict TypeScript project checks |
| `bun run test` | Run deterministic unit and component tests |
| `bun run test:e2e` | Run browser workflows |
| `bun run build` | Produce the static Pages artifact |
| `bun run verify` | Run repository checks, tests, and production build |

## Verification layers

### Domain unit tests

- Repository input normalization and rejection.
- Edge direction and deduplication.
- External-node synthesis.
- Topological layers, roots, sinks, and depth.
- Strongly connected components and self-edges.
- Ready queue, blocked count, critical path, and reachability.
- Combined text, state, readiness, cycle, label, and external filters.
- The 39-node, 116-edge implementation blueprint.

### GitHub client contract tests

- One-page and multi-page repository responses.
- Progress reporting and cursor advancement.
- Missing or inaccessible repositories.
- HTTP and GraphQL errors.
- Zod schema rejection.
- Dependency truncation.
- Request abortion.
- Lazy issue body success and disappearance.
- Token non-disclosure in data and error paths.

### Browser and accessibility tests

- Zero-token first load.
- Search, state, readiness, label, and external-node filters.
- List and graph selection synchronization.
- Upstream and downstream focus.
- Horizontal and vertical layout.
- Fit, JSON export, and PNG export.
- Repository dialog validation and token clearing.
- Light and dark modes.
- Desktop issue rail and inspector.
- Tablet inspector overlay.
- Phone issue and detail overlays.
- Keyboard navigation, accessible names, focus visibility, and automated WCAG checks.
- No unexpected console errors.

## CI workflow

On pull requests and main pushes:

1. Check out the exact revision.
2. Install the pinned Bun release.
3. Install with the frozen lockfile.
4. Run formatting/lint/type verification.
5. Run unit and contract tests.
6. Install the required Playwright browser.
7. Run browser and accessibility tests.
8. Build the production artifact.
9. Upload browser traces and screenshots only on failure.

The Pages workflow depends on successful verification. It does not rebuild unverified source through an unrelated dependency path.

## GitHub Pages delivery

Use the official Pages workflow actions to configure Pages, upload the Vite `dist` directory, and deploy. The deployment job uses the `github-pages` environment and exposes the resulting page URL.

Required workflow permissions:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

The repository must use GitHub Actions as its Pages build source. The deployed site is expected at `https://ccheney.github.io/github-issue-dag-viewer/`.

## Live dogfood gate

After Pages deploys:

1. Open the public site in zero-token demo mode.
2. Load `ccheney/github-issue-dag-viewer` through the normal repository flow.
3. Compare 39 nodes, 116 edges, issue titles, labels, states, dependencies, readiness, layers, and critical path.
4. Exercise selection and inspection across completed, ready, blocked, and deep critical-path issues.
5. Confirm the browser sends repository data only to GitHub GraphQL.

The live graph and offline blueprint must agree before visual QA can close.

## Visual matrix

Test current stable Chromium at minimum across:

| Viewport | Light | Dark | Required focus |
| --- | --- | --- | --- |
| 1440×900 desktop | Yes | Yes | Three panes, dense graph, Markdown |
| 1024×768 tablet | Yes | Yes | Inspector overlay and toolbar density |
| 390×844 phone | Yes | Yes | Issue rail, bottom inspector, close controls |

Add Safari and Firefox manual checks before the first tagged release because canvas text, dialog behavior, downloads, and CSS color functions can differ.

## Performance program

The current reference measurements and first-release budgets are recorded in [the large-graph benchmark](../performance/large-graph-benchmark.md).

Generate deterministic 1,000-node and 5,000-node fixtures with sparse chains, wide fan-out, and fan-in. Measure:

- Snapshot transformation time.
- Adjacency and analysis time.
- Dagre layout time.
- Peak browser memory.
- Pan, zoom, selection, and filter latency.
- PNG export time and dimensions.
- Initial JavaScript transfer and parse cost.

The current production bundle warning is a measured delivery task, not a reason to disable warnings. Split Cytoscape, Dagre, and Markdown code only when measurements show an improvement to first interaction without degrading graph transitions.

## Ordered delivery increments

1. Complete GitHub client contract tests.
2. Complete browser and accessibility workflows.
3. Add CI and make verification reproducible.
4. Add the Pages deployment workflow and enable Pages.
5. Complete contributor, privacy, and usage documentation.
6. Load the live implementation graph through the public site.
7. Complete desktop/mobile and light/dark visual QA.
8. Benchmark large repositories and define guardrails.
9. Optimize bundle delivery against measured budgets.
10. Tag the first production release.

## Release gates

- All native issue dependencies are connected and the ready queue is accurate.
- Formatting, linting, strict types, unit tests, contract tests, browser tests, and build pass.
- Pages serves the verified main revision with working assets and CSP.
- Live and offline blueprint graphs match.
- Desktop, tablet, and phone matrices pass in both color modes.
- Large-graph limits and bundle budgets are measured and documented.
- Setup, token permissions, privacy behavior, graph semantics, and deployment are documented.
- No open blocker remains on the release issue.
