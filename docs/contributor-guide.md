# Contributor and operations guide

This guide is the practical path from a clean clone to a verified local build or GitHub Pages deployment. The documents in [`docs/plans`](./plans/README.md) contain the detailed product and architecture decisions.

## Prerequisites

The repository pins:

- Bun 1.3.14 for dependency management, scripts, tests, and builds.
- GitHub CLI 2.96.0 for maintainers working with repository issues and deployments.

Install the versions in [`.tool-versions`](../.tool-versions) with a compatible version manager, then install the locked dependency graph:

```sh
bun install --frozen-lockfile
```

Install Chromium before running the browser suite locally:

```sh
bunx playwright install chromium
```

## Run locally

Start Vite:

```sh
bun run dev
```

Open the URL printed by Vite. The initial demo needs no token and uses the repository's offline implementation blueprint.

To load a live repository:

1. Choose **Open repository**.
2. Enter `owner/repository` or a `github.com/owner/repository` URL.
3. Enter a GitHub token with access to that repository.
4. Choose **Load graph**.

The URL query stores only the repository name. A reload requires the token again.

## GitHub token permissions

Use a fine-grained personal access token with:

- Repository access limited to the repositories that should be viewable.
- **Issues: Read-only** repository permission.
- **Metadata: Read-only**, which GitHub includes as the mandatory repository metadata permission.

No write permission is used. Organization policy, SAML authorization, and token approval rules can still limit private-repository access. The application requires authentication for its GitHub GraphQL requests even when viewing a public repository.

The token is sent only as the authorization header for `https://api.github.com/graphql`. It remains in a React ref for the current tab so the selected issue body can be loaded lazily. It is not written to browser storage, URLs, logs, exports, source maps, or Pages artifacts. Loading demo mode, replacing the repository, refreshing, or closing the tab discards it.

## Viewer behavior

GitHub's dependency direction is preserved:

```text
blocker -> blocked issue
```

An open issue is ready when every retrieved incoming blocker is closed. The graph also computes roots, sinks, topological layers, cycles, open critical path, and transitive upstream and downstream neighborhoods. See [the graph plan](./plans/02-graph-domain-and-analysis.md) for the exact algorithms.

The query field supports free text and these qualifiers:

| Qualifier | Meaning |
| --- | --- |
| `state:open`, `state:closed` | Issue state |
| `is:ready`, `is:blocked`, `is:cyclic` | Computed readiness |
| `label:"area:ui"` | Inclusive label match; repeat for additional labels |
| `-is:external` | Hide cross-repository dependency nodes |

State, Readiness, and Labels menus write the same syntax into the query. Query input is briefly debounced, and filtering hides or shows the existing laid-out topology instead of rerunning Dagre on every keystroke.

The application follows the operating system's light or dark preference. There is no separate stored theme preference.

## Exports

**Export** downloads readable JSON containing the active repository metadata and only issues in the current filter result. It never contains the token or request headers.

**PNG** renders the currently visible Cytoscape graph on a light background. It is available only when both layout dimensions are at most 6,000 pixels.

**SVG** downloads the complete visible graph as a scalable vector image in the active system color mode. It remains available when the graph is too large for a bounded PNG.

## Architecture

The application is static and has no backend:

```text
src/
├── components/   React and Cytoscape presentation
├── demo/         offline projection of the live issue blueprint
├── domain/       graph contracts, normalization, analysis, and filters
├── github/       repository parsing, GraphQL requests, and response schemas
├── hooks/        system color-mode integration
└── styles/       shell, graph, inspector, and responsive CSS
```

The browser calls GitHub GraphQL directly. Zod validates the response before it enters the domain. React Markdown renders issue bodies without raw HTML support. The issue list and inspector remain the accessible interaction path alongside the canvas.

## Verification commands

| Command | Result |
| --- | --- |
| `bun run check` | Biome formatting/lint checks and strict TypeScript |
| `bun run check:bundle` | Enforced compressed production bundle budgets after a build |
| `bun run typecheck` | Strict TypeScript only |
| `bun run test` | Unit and GitHub client contract tests |
| `bun run test:e2e` | Desktop/mobile Playwright and automated accessibility workflows |
| `bun run build` | Type check and production Vite build in `dist` |
| `bun run verify` | All repository gates in CI order |
| `bun run benchmark:graphs` | Deterministic large-graph measurements |

Run `bun run verify` before pushing. The build reports upstream Primer `@position-try` minifier warnings and Vite's raw entry-size warning while independently enforcing compressed bundle budgets; do not suppress those warnings to make the output quieter.

## GitHub Pages deployment

The repository's Pages build source must be **GitHub Actions**. The single [CI workflow](../.github/workflows/ci.yml) runs on pull requests and `main` pushes:

1. Check out the exact revision without persisted credentials.
2. Install the pinned Bun version and frozen lockfile.
3. Install Chromium and run `bun run verify`.
4. Configure Pages and upload that verified `dist` directory.
5. Let the dependent deployment job publish the same artifact to the `github-pages` environment.

Only the deployment job receives `contents: read`, `pages: write`, and `id-token: write`. The public site is [ccheney.github.io/github-issue-dag-viewer](https://ccheney.github.io/github-issue-dag-viewer/).

To verify a deployment, confirm the CI run succeeded, its Pages deployment references the expected commit SHA, and the public document plus relative `assets/` URLs return HTTP 200.

## Security and CSP boundary

The static document allows scripts and fonts from self, API connections only to GitHub, and images only from the documented GitHub hosts and data URLs. Objects, frames, form actions, and alternate base URIs are disabled. Primer requires inline styles for runtime presentation.

GitHub Pages cannot emit the response-header-only `frame-ancestors` directive. The meta policy therefore does not claim framing protection. Moving to a host that can set response headers is required if inbound framing control becomes a requirement. See [the security plan](./plans/04-security-and-privacy.md) for the complete trust-boundary analysis.

## Known limits

- GitHub issue pagination is complete, but each issue's `blockedBy` and `blocking` connection is capped at 100 entries. The UI warns when a relationship is truncated.
- Cross-repository nodes are partial references; their labels, actors, bodies, and complete dependency neighborhoods are not fetched.
- Dagre layout becomes multi-second on graphs with thousands of issues and exceeded the stack on the measured 5,000-node chain. Layout requires consent above 1,000 issues and is unavailable above 5,000; current measurements are in [the large-graph benchmark](./performance/large-graph-benchmark.md).
- PNG export is unavailable when either visible graph dimension exceeds 6,000 pixels. SVG remains a complete visual export, and JSON remains the complete filtered data export.
- System color mode is the only theme mode.
- The static Pages host cannot provide response-header framing controls.

## Change checklist

1. Keep changes scoped to the owning feature or domain module.
2. Add or update the smallest test that proves the behavior.
3. Run `bun run verify`.
4. Update the relevant plan and blueprint issue when behavior or acceptance criteria change.
5. Push coherent commits to `main`; successful verification deploys the exact artifact automatically.
