import type { BlueprintTask } from './blueprint-types'

export const deliveryTasks: readonly BlueprintTask[] = [
  {
    id: 'path-focus',
    title: 'Focus selected upstream and downstream paths',
    area: 'area:ui',
    dependencies: ['workflow-analysis', 'graph-canvas'],
    completed: true,
    outcome:
      'Make a selected issue and its transitive dependency neighborhood immediately legible.',
    scope: [
      'Highlight upstream blockers, downstream work, and connecting edges with distinct semantic tones.',
      'Dim unrelated nodes without removing them from the spatial context.',
    ],
    acceptance: 'Selecting any issue visually isolates every reachable predecessor and successor.',
  },
  {
    id: 'inspector',
    title: 'Build the issue dependency inspector',
    area: 'area:ui',
    dependencies: ['primer-system', 'graphql-client', 'dependency-ingestion', 'issue-navigation'],
    completed: true,
    outcome: 'Expose issue metadata, relationships, and description without leaving the graph.',
    scope: [
      'Show state, repository, labels, author, milestone, layer, readiness, blockers, and blocked work.',
      'Lazy-load the selected issue body and render GitHub-flavored Markdown.',
    ],
    acceptance:
      'A selected node has complete accessible context and a direct link to its GitHub issue.',
  },
  {
    id: 'security-boundary',
    title: 'Enforce ephemeral token handling and content security policy',
    area: 'area:security',
    dependencies: ['scope', 'pages-architecture', 'graphql-client', 'inspector'],
    completed: true,
    outcome:
      'Keep repository credentials and rendered issue content inside a narrow browser boundary.',
    scope: [
      'Hold tokens only in React memory and clear token input state whenever the repository dialog closes.',
      'Restrict scripts, connections, images, forms, frames, and base URLs with a static CSP.',
    ],
    acceptance:
      'Tokens never enter storage, URLs, logs, exports, errors, source, or generated assets.',
  },
  {
    id: 'exports',
    title: 'Export filtered graph data and PNG images',
    area: 'area:ui',
    dependencies: ['adjacency', 'issue-navigation', 'graph-canvas'],
    completed: true,
    outcome: 'Let users take the current graph view into documentation and analysis workflows.',
    scope: [
      'Export the filtered issue snapshot as readable JSON without credentials.',
      'Render the full current Cytoscape graph to a bounded PNG image.',
    ],
    acceptance:
      'Both export actions produce local files that reflect the active repository and filters.',
  },
  {
    id: 'color-modes',
    title: 'Implement GitHub light and dark color modes',
    area: 'area:ui',
    dependencies: ['primer-system', 'graph-canvas', 'inspector'],
    completed: true,
    outcome: 'Keep the application and graph readable across GitHub-aligned light and dark themes.',
    scope: [
      'Drive Primer ThemeProvider and Cytoscape palettes from one color-mode hook.',
      'Follow the system color preference continuously without a separate application override.',
    ],
    acceptance:
      'All controls, text, graph states, focus rings, and Markdown retain sufficient contrast in both modes.',
  },
  {
    id: 'responsive-shell',
    title: 'Build the responsive three-pane application shell',
    area: 'area:ui',
    dependencies: ['primer-system', 'issue-navigation', 'graph-canvas', 'inspector', 'color-modes'],
    completed: true,
    outcome:
      'Adapt issue navigation, graph exploration, and details from desktop to narrow mobile screens.',
    scope: [
      'Use a fixed-height desktop grid with independently scrolling list and inspector panes.',
      'Convert list and inspector into explicit openable and closable mobile overlays.',
    ],
    acceptance:
      'Core workflows remain available without clipped content at desktop, tablet, and phone widths.',
  },
  {
    id: 'domain-tests',
    title: 'Cover graph analysis, filters, and repository parsing',
    area: 'area:quality',
    dependencies: [
      'quality-config',
      'repository-parser',
      'adjacency',
      'topology',
      'cycles',
      'workflow-analysis',
      'issue-navigation',
    ],
    completed: true,
    outcome: 'Lock down deterministic domain behavior with focused unit tests.',
    scope: [
      'Test valid and invalid repository forms, combined filters, label catalogs, and the full blueprint graph.',
      'Test edge deduplication, cycles, reachability, layers, readiness, and critical paths.',
    ],
    acceptance:
      'The unit suite detects directional, ordering, cycle, filtering, and parsing regressions.',
  },
  {
    id: 'graphql-tests',
    title: 'Add GitHub GraphQL pagination and contract tests',
    area: 'area:quality',
    dependencies: [
      'graphql-client',
      'pagination',
      'dependency-ingestion',
      'security-boundary',
      'domain-tests',
    ],
    completed: true,
    outcome:
      'Verify the remote data boundary without depending on live GitHub during the unit suite.',
    scope: [
      'Mock paginated success, missing repositories, API errors, schema drift, truncation, and aborts.',
      'Assert authorization values cannot appear in transformed data or error messages.',
    ],
    acceptance:
      'GraphQL behavior is deterministic and every supported failure mode has a focused test.',
  },
  {
    id: 'browser-tests',
    title: 'Add end-to-end and accessibility workflow tests',
    area: 'area:quality',
    dependencies: [
      'path-focus',
      'inspector',
      'color-modes',
      'responsive-shell',
      'domain-tests',
      'graphql-tests',
    ],
    completed: true,
    outcome: 'Exercise the complete zero-token user journey in a real browser.',
    scope: [
      'Test searching, filtering, selection, path focus, layout changes, theme changes, exports, and dialogs.',
      'Test keyboard operation, accessible names, mobile panel controls, and high-level automated accessibility rules.',
    ],
    acceptance:
      'Chromium runs the primary desktop and mobile workflows without console or accessibility failures.',
  },
  {
    id: 'ci',
    title: 'Run strict quality gates in GitHub Actions',
    area: 'area:delivery',
    dependencies: ['quality-config', 'domain-tests', 'graphql-tests', 'browser-tests'],
    completed: true,
    outcome: 'Prevent unverified source from reaching the Pages deployment branch.',
    scope: [
      'Install the pinned Bun toolchain and run formatting, linting, types, unit tests, browser tests, and build.',
      'Cache only deterministic inputs and upload browser evidence when a workflow fails.',
    ],
    acceptance:
      'Pull requests and main pushes expose one reproducible required verification result.',
  },
  {
    id: 'pages-workflow',
    title: 'Deploy the static application to GitHub Pages',
    area: 'area:delivery',
    dependencies: ['pages-architecture', 'security-boundary', 'ci'],
    completed: true,
    outcome: 'Publish a production build from main with GitHub-native deployment provenance.',
    scope: [
      'Build and upload the Pages artifact with the official configure, upload, and deploy actions.',
      'Grant only contents read, Pages write, and OIDC token permissions to the deployment job.',
    ],
    acceptance:
      'The public Pages URL serves the exact verified main revision with working relative assets.',
  },
  {
    id: 'documentation',
    title: 'Document setup, token permissions, privacy, and deployment',
    area: 'area:docs',
    dependencies: ['scope', 'security-boundary', 'exports', 'pages-workflow'],
    completed: true,
    outcome: 'Make the project understandable and safely operable from a clean clone.',
    scope: [
      'Document the architecture, development commands, graph semantics, exports, and Pages workflow.',
      'Document minimum fine-grained token permissions, in-memory handling, limitations, and CSP boundary.',
    ],
    acceptance:
      'A new contributor can run, verify, deploy, and use the viewer without undocumented steps.',
  },
  {
    id: 'blueprint-publication',
    title: 'Create and validate the native issue dependency blueprint',
    area: 'area:delivery',
    dependencies: ['graphql-client', 'blueprint-model', 'security-boundary'],
    completed: true,
    outcome:
      'Turn the implementation catalog into a validated native GitHub issue dependency graph.',
    scope: [
      'Create labeled issues in stable implementation order with native blocked-by relationships.',
      'Validate every issue title, state, label, and dependency against the local blueprint projection.',
    ],
    acceptance:
      'The published graph has no missing, reversed, duplicated, unlabeled, or disconnected tasks.',
  },
  {
    id: 'live-blueprint',
    title: 'Publish the implementation blueprint as the live example DAG',
    area: 'area:delivery',
    dependencies: ['blueprint-model', 'blueprint-publication'],
    completed: true,
    outcome:
      'Populate this repository with the same implementation graph shown by zero-token demo mode.',
    scope: [
      'Create every blueprint task as an issue with area labels and native dependency links.',
      'Close only tasks whose acceptance criteria are already met in the working implementation.',
    ],
    acceptance:
      'The repository issue graph is comprehensive, connected, and representative of actual project state.',
  },
  {
    id: 'live-dogfood',
    title: 'Load the repository’s own live dependency graph',
    area: 'area:quality',
    dependencies: ['graphql-tests', 'pages-workflow', 'live-blueprint'],
    completed: true,
    outcome: 'Use the production application against its own native GitHub issue DAG.',
    scope: [
      'Load ccheney/github-issue-dag-viewer through the same arbitrary repository flow users receive.',
      'Compare live issue counts, states, labels, edges, readiness, layers, and critical path with the offline projection.',
    ],
    acceptance:
      'Live and demo modes describe the same blueprint without missing, reversed, or duplicate relationships.',
  },
  {
    id: 'visual-qa',
    title: 'Verify desktop and mobile layouts in light and dark modes',
    area: 'area:quality',
    dependencies: ['color-modes', 'responsive-shell', 'browser-tests', 'live-dogfood'],
    completed: true,
    outcome: 'Validate the GitHub-inspired interface across the intended visual matrix.',
    scope: [
      'Inspect representative desktop, tablet, and phone viewports in both color modes.',
      'Exercise dense graphs, empty filters, warnings, dialogs, overlays, long titles, and Markdown bodies.',
    ],
    acceptance:
      'No primary workflow has unreadable nodes, clipped controls, hidden panels, or contrast regressions.',
  },
  {
    id: 'large-graph-benchmark',
    title: 'Benchmark repositories with thousands of issues',
    area: 'area:performance',
    dependencies: ['pagination', 'topology', 'cycles', 'graph-canvas', 'domain-tests'],
    completed: true,
    outcome: 'Measure the practical limits of ingestion, analysis, layout, and interaction.',
    scope: [
      'Generate representative 1,000-node and 5,000-node sparse and fan-out graphs.',
      'Record fetch-independent analysis time, layout time, memory, interaction latency, and export behavior.',
    ],
    acceptance:
      'Published budgets and measurements identify safe defaults and any necessary large-graph guardrails.',
  },
  {
    id: 'bundle-performance',
    title: 'Optimize initial loading and graph bundle delivery',
    area: 'area:performance',
    dependencies: [
      'graph-canvas',
      'inspector',
      'exports',
      'pages-workflow',
      'large-graph-benchmark',
    ],
    completed: true,
    outcome: 'Reduce the cost of loading the static viewer without weakening graph capability.',
    scope: [
      'Measure and split heavy graph and Markdown dependencies where it improves user-visible loading.',
      'Set bundle and interaction budgets informed by the large-graph benchmark.',
    ],
    acceptance: 'The production build meets documented transfer and interaction budgets on Pages.',
  },
  {
    id: 'release',
    title: 'Publish the first production release',
    area: 'area:delivery',
    dependencies: [
      'documentation',
      'live-dogfood',
      'visual-qa',
      'large-graph-benchmark',
      'bundle-performance',
    ],
    completed: true,
    outcome: 'Cut a reproducible first release after the blueprint’s delivery gates are complete.',
    scope: [
      'Verify the release commit, Pages deployment, live example DAG, documentation, and known limitations.',
      'Create a tagged release with concise user-facing capabilities and upgrade expectations.',
    ],
    acceptance:
      'The tagged artifact, Pages site, source, and issue state all identify the same verified revision.',
  },
  {
    id: 'repository-license-readme',
    title: 'Add the MIT license and concise project README',
    area: 'area:docs',
    dependencies: ['release'],
    completed: true,
    outcome:
      'Finish the public repository with a standard MIT license and a concise README that gets users from purpose to a working viewer quickly.',
    scope: [
      'Add a standard MIT `LICENSE` file with the correct copyright year and holder.',
      'Write a concise `README.md` covering the viewer’s purpose, hosted app, local setup, token/privacy boundary, and verification commands.',
      'Keep detailed architecture and delivery rationale in `docs/plans` rather than duplicating it in the README.',
    ],
    acceptance: [
      'GitHub recognizes the repository license as MIT.',
      'A new user can understand the project, open the hosted viewer, and run it locally from the README alone.',
      'README links and commands are valid, and relevant formatting, linting, type checking, tests, and production builds pass.',
    ],
    includeStandardVerification: false,
    plans: ['00-product-scope-and-decisions.md', '05-quality-deployment-and-roadmap.md'],
  },
] as const
