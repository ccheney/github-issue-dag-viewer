# GitHub Issue DAG Viewer implementation plans

These plans define a repository-agnostic GitHub issue dependency explorer. The application accepts a `github.com` repository reference, reads native issue dependencies through GitHub GraphQL, computes workflow structure in the browser, and renders an interactive DAG beside an accessible issue list and inspector.

The plans capture the decisions behind the implementation and the remaining delivery work. The repository's own issues are the executable dependency graph for these plans, and the zero-token demo is an offline projection of that graph.

## Fixed decisions

- Build a generic viewer that is not tied to Lingora or any other source repository.
- Deploy a static single-page application to GitHub Pages; do not introduce an application backend.
- Call `api.github.com/graphql` directly with a token supplied by the user.
- Keep the token in tab memory only. Never place it in storage, URLs, logs, exports, source, or generated assets.
- Use React, strict ES2024 TypeScript, Vite, and Bun.
- Use GitHub Primer React, Primer tokens, and Octicons for the application shell.
- Use Cytoscape with Dagre for interactive directed-graph rendering.
- Preserve GitHub's native dependency direction: a blocker is the edge source and the blocked issue is the target.
- Keep an accessible HTML issue list and inspector as the primary non-canvas interaction path.
- Treat the repository's live issue DAG as the product's example and implementation blueprint.

## Plan map

| Document | Purpose |
| --- | --- |
| [00-product-scope-and-decisions.md](./00-product-scope-and-decisions.md) | Product promise, users, fixed scope, constraints, and success criteria |
| [01-application-architecture-and-github-data.md](./01-application-architecture-and-github-data.md) | Static architecture, module boundaries, GitHub GraphQL ingestion, and failure behavior |
| [02-graph-domain-and-analysis.md](./02-graph-domain-and-analysis.md) | Dependency semantics, normalization, algorithms, filters, and blueprint projection |
| [03-user-interface-and-accessibility.md](./03-user-interface-and-accessibility.md) | Primer visual language, desktop/mobile shell, interactions, and accessibility |
| [04-security-and-privacy.md](./04-security-and-privacy.md) | Token lifecycle, content boundaries, CSP, exports, and threat controls |
| [05-quality-deployment-and-roadmap.md](./05-quality-deployment-and-roadmap.md) | Verification layers, CI, Pages, performance, execution order, and release gates |

## Execution rule

Implement issues in native dependency order. An open issue is ready only when every issue in its `blockedBy` connection is closed. Close an issue only when its acceptance criteria and relevant repository checks pass.

The live graph is authoritative for current task state. These plans are authoritative for architecture, semantics, and acceptance criteria. If implementation evidence requires a decision change, update the relevant plan and affected issues together.

## Version policy

Before adding or updating a package, query its authoritative registry and install the latest stable release unless a documented incompatibility requires otherwise. Commit exact dependency versions, Bun's lockfile, and pinned tool versions.
