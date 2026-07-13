import type { BlueprintTask } from './blueprint-types'

export const foundationTasks: readonly BlueprintTask[] = [
  {
    id: 'scope',
    title: 'Define the generic repository viewer and privacy boundary',
    area: 'area:foundation',
    dependencies: [],
    completed: true,
    outcome:
      'Define a repository-agnostic issue dependency viewer with an explicit browser trust boundary.',
    scope: [
      'Accept any github.com repository URL while keeping the product independent of Lingora.',
      'Keep credentials ephemeral and send them only to the GitHub GraphQL endpoint.',
    ],
    acceptance:
      'The product scope, supported host, authentication boundary, and non-goals are unambiguous.',
  },
  {
    id: 'repository',
    title: 'Create the standalone public repository',
    area: 'area:foundation',
    dependencies: ['scope'],
    completed: true,
    outcome:
      'Create an independent public home for the application and its GitHub Pages deployment.',
    scope: [
      'Create ccheney/github-issue-dag-viewer with main as its default branch.',
      'Keep all viewer code and issue history separate from any repository it visualizes.',
    ],
    acceptance:
      'The empty repository is publicly reachable and can host Issues, Actions, and Pages.',
  },
  {
    id: 'toolchain',
    title: 'Pin the Bun and GitHub CLI toolchain',
    area: 'area:foundation',
    dependencies: ['repository'],
    completed: true,
    outcome: 'Make local development and GitHub automation reproducible with current stable tools.',
    scope: [
      'Pin Bun and GitHub CLI versions in .tool-versions.',
      'Generate the dependency lockfile with exact package versions.',
    ],
    acceptance:
      'A clean environment resolves the declared tools and installs the same dependency graph.',
  },
  {
    id: 'application-shell',
    title: 'Scaffold the React, Vite, and strict TypeScript application',
    area: 'area:foundation',
    dependencies: ['repository', 'toolchain'],
    completed: true,
    outcome: 'Establish a static React application compiled by Vite with ES2024 TypeScript.',
    scope: [
      'Configure React 19, Vite 8, strict project references, and browser entry points.',
      'Use exact optional properties, unchecked index protection, and no implicit escape hatches.',
    ],
    acceptance: 'The application type-checks and produces a static production bundle.',
  },
  {
    id: 'quality-config',
    title: 'Establish strict formatting, linting, and test commands',
    area: 'area:quality',
    dependencies: ['application-shell'],
    completed: true,
    outcome: 'Create deterministic local quality gates for source, styles, types, and tests.',
    scope: [
      'Configure Biome formatting and recommended lint rules with bounded complexity.',
      'Expose check, fix, typecheck, test, build, and verify scripts through Bun.',
    ],
    acceptance:
      'One verification command fails on formatting, lint, type, test, or build regressions.',
  },
  {
    id: 'pages-architecture',
    title: 'Choose a static GitHub Pages and direct GraphQL architecture',
    area: 'area:foundation',
    dependencies: ['scope', 'repository'],
    completed: true,
    outcome: 'Avoid a backend by running the viewer entirely on GitHub Pages.',
    scope: [
      'Call api.github.com/graphql directly from the browser with a user-supplied token.',
      'Use relative asset paths so project Pages deployments work without runtime configuration.',
    ],
    acceptance:
      'The production bundle requires no server, database, proxy, or repository-specific setting.',
  },
  {
    id: 'primer-system',
    title: 'Establish the GitHub Primer visual system',
    area: 'area:ui',
    dependencies: ['scope', 'application-shell'],
    completed: true,
    outcome: 'Make the application feel native to GitHub without copying GitHub product chrome.',
    scope: [
      'Use Primer React, Octicons, GitHub system typography, tokens, spacing, and control shapes.',
      'Reserve visual distinction for the dependency canvas and graph states.',
    ],
    acceptance:
      'Shell, controls, states, borders, and typography are coherent in GitHub light and dark themes.',
  },
  {
    id: 'domain-contracts',
    title: 'Define repository, issue, dependency, and graph contracts',
    area: 'area:graph',
    dependencies: ['scope', 'application-shell'],
    completed: true,
    outcome:
      'Create typed contracts that separate GitHub responses from graph analysis and presentation.',
    scope: [
      'Model repositories, issue metadata, labels, actors, dependency references, and load progress.',
      'Model edges, adjacency, layers, cycles, readiness, critical paths, and filters.',
    ],
    acceptance:
      'Domain algorithms and UI components consume stable types without GraphQL response coupling.',
  },
  {
    id: 'repository-parser',
    title: 'Parse arbitrary GitHub repository references',
    area: 'area:api',
    dependencies: ['domain-contracts'],
    completed: true,
    outcome: 'Normalize owner/name, HTTPS, issue URLs, and SSH-style GitHub repository inputs.',
    scope: [
      'Strip irrelevant path segments and .git suffixes while preserving valid owner and name characters.',
      'Reject empty, malformed, and non-github.com inputs with actionable errors.',
    ],
    acceptance:
      'Supported repository forms resolve to one canonical RepositoryRef and invalid forms fail safely.',
  },
  {
    id: 'graphql-client',
    title: 'Implement schema-validated GitHub GraphQL requests',
    area: 'area:api',
    dependencies: ['pages-architecture', 'domain-contracts', 'repository-parser'],
    completed: true,
    outcome: 'Create a typed request boundary for authenticated GitHub GraphQL calls.',
    scope: [
      'Send explicit API headers, no-store requests, abort signals, and structured variables.',
      'Validate successful payloads with Zod and collapse API failures into safe user-facing errors.',
    ],
    acceptance:
      'Unexpected responses never enter the domain model and credentials never appear in errors.',
  },
  {
    id: 'pagination',
    title: 'Paginate complete repository issue metadata',
    area: 'area:api',
    dependencies: ['graphql-client'],
    completed: true,
    outcome: 'Load every issue in a repository instead of stopping at GitHub connection limits.',
    scope: [
      'Follow pageInfo cursors in deterministic creation order with pages of 100 issues.',
      'Report loaded and total issue counts while retaining rate-limit metadata.',
    ],
    acceptance:
      'Multi-page repositories produce one complete snapshot or a clear abort/error state.',
  },
  {
    id: 'dependency-ingestion',
    title: 'Ingest native blocked-by and blocking relationships',
    area: 'area:api',
    dependencies: ['graphql-client', 'pagination'],
    completed: true,
    outcome:
      'Read GitHub native issue dependencies in both directions, including cross-repository nodes.',
    scope: [
      'Query blockedBy and blocking connections with repository identity on every referenced issue.',
      'Flag nodes whose dependency connection exceeds the retrieved relationship limit.',
    ],
    acceptance:
      'A snapshot preserves native direction, external repository identity, and truncation warnings.',
  },
  {
    id: 'adjacency',
    title: 'Normalize nodes, edges, and adjacency maps',
    area: 'area:graph',
    dependencies: ['domain-contracts', 'dependency-ingestion'],
    completed: true,
    outcome: 'Convert issue snapshots into a deduplicated directed graph.',
    scope: [
      'Synthesize external nodes and deduplicate edges reported from both relationship directions.',
      'Build incoming and outgoing adjacency maps for every local and external node.',
    ],
    acceptance:
      'Each logical blocker relationship appears exactly once with blocker as source and blocked issue as target.',
  },
  {
    id: 'topology',
    title: 'Compute topological layers, roots, sinks, and depth',
    area: 'area:graph',
    dependencies: ['adjacency'],
    completed: true,
    outcome: 'Derive stable structural metadata for directed acyclic portions of the issue graph.',
    scope: [
      'Use deterministic Kahn layers and preserve nodes when malformed cycles remain.',
      'Identify root, sink, and maximum depth statistics for navigation and summary surfaces.',
    ],
    acceptance:
      'Equivalent issue sets yield stable layers independent of API relationship duplication.',
  },
  {
    id: 'cycles',
    title: 'Detect dependency cycles and self-blocking issues',
    area: 'area:graph',
    dependencies: ['adjacency', 'topology'],
    completed: true,
    outcome: 'Surface invalid dependency structures without dropping affected nodes.',
    scope: [
      'Find strongly connected components and explicit self-edges.',
      'Expose cycle membership to warnings, filters, statistics, and node styling.',
    ],
    acceptance: 'Every cyclic component is reported once and all its issues remain inspectable.',
  },
  {
    id: 'workflow-analysis',
    title: 'Compute readiness, critical path, and reachability',
    area: 'area:graph',
    dependencies: ['topology', 'cycles'],
    completed: true,
    outcome: 'Turn the dependency graph into actionable implementation sequencing information.',
    scope: [
      'Mark an open issue ready only when every incoming blocker is closed.',
      'Compute the open critical path plus transitive upstream and downstream neighborhoods.',
    ],
    acceptance:
      'Ready, blocked, critical, upstream, and downstream states match dependency semantics.',
  },
  {
    id: 'blueprint-model',
    title: 'Model the viewer implementation as its example DAG',
    area: 'area:graph',
    dependencies: ['domain-contracts', 'adjacency', 'topology', 'cycles', 'workflow-analysis'],
    completed: true,
    outcome:
      'Replace synthetic sample work with the concrete implementation blueprint for this application.',
    scope: [
      'Represent technical decisions and implementation increments from initial scope through release.',
      'Share one ordered task catalog between zero-token demo data and live GitHub issue seeding.',
    ],
    acceptance:
      'The demo graph is a faithful offline projection of the repository issue dependency graph.',
  },
  {
    id: 'issue-navigation',
    title: 'Build issue search, filters, and the accessible issue list',
    area: 'area:ui',
    dependencies: ['primer-system', 'domain-contracts', 'topology', 'workflow-analysis'],
    completed: true,
    outcome: 'Provide a precise non-canvas path to find and select issues.',
    scope: [
      'Filter by text, state, readiness, cycle membership, labels, and external-node visibility.',
      'Sort ready work first and expose labels, dependency counts, repository identity, and state.',
    ],
    acceptance:
      'Every visible graph node can be found and selected with keyboard-accessible HTML controls.',
  },
  {
    id: 'graph-canvas',
    title: 'Render the directed issue graph with Cytoscape and Dagre',
    area: 'area:ui',
    dependencies: ['primer-system', 'adjacency', 'topology', 'blueprint-model'],
    completed: true,
    outcome: 'Render a pannable, zoomable dependency map with deterministic directional layout.',
    scope: [
      'Build Cytoscape elements from filtered issues and lay them out left-to-right or top-to-bottom.',
      'Style ready, open, closed, external, cyclic, critical, and selected nodes with Primer-aligned colors.',
    ],
    acceptance:
      'The canvas renders native blocker direction and supports layout switching, fitting, panning, and zooming.',
  },
] as const
