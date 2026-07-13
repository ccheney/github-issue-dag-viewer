# Product scope and decisions

## Product promise

Turn native GitHub issue dependencies into a legible implementation map. A user supplies any `github.com/owner/repository` URL and can see what is ready, what is blocked, which work sits on the critical path, and how an issue connects to upstream and downstream work.

The viewer complements GitHub Issues. It does not replace issue editing, Projects, milestones, or GitHub's issue detail page.

## Primary users

- Maintainers planning implementation order across a large issue set.
- Contributors looking for ready work and the blockers behind a task.
- Reviewers validating that an issue plan is connected and acyclic.
- Technical leads explaining a roadmap through a visual dependency graph.

## Core workflows

1. Open the zero-token implementation blueprint.
2. Enter an arbitrary GitHub repository URL and read-only token.
3. Load every issue and its native `blockedBy` and `blocking` connections.
4. Search and filter by state, readiness, cycle membership, label, or repository boundary.
5. Select an issue and focus its upstream and downstream paths.
6. Inspect metadata, direct relationships, and GitHub-flavored Markdown.
7. Change graph direction, fit the full graph, or export JSON and PNG artifacts.
8. Open the source issue on GitHub when editing or discussion is required.

## Supported repository inputs

- `owner/repository`
- `https://github.com/owner/repository`
- A deeper GitHub path such as an issue URL; only owner and repository are retained.
- `git@github.com:owner/repository.git`

Only `github.com` is supported in the first release. GitHub Enterprise Server requires configurable origins, authentication behavior, API compatibility, and a distinct CSP policy; it is not silently treated as equivalent.

## Authentication model

GitHub GraphQL requires authentication, including for public repository issue dependency data. The user supplies a token with metadata read and issue read access to the repository being viewed. The application does not create, broker, or persist tokens.

The zero-token demo remains fully functional so users can evaluate graph navigation before granting repository access.

## Release scope

### First production release

- Static GitHub Pages deployment.
- Arbitrary public and token-accessible private repositories on `github.com`.
- Complete issue pagination.
- Native dependency ingestion in both directions.
- Cross-repository dependency nodes.
- Deterministic graph normalization, layers, cycles, readiness, and critical path.
- Primer-aligned light and dark interfaces.
- Desktop three-pane layout and mobile issue/detail overlays.
- Search, filters, issue inspector, Markdown, JSON export, and PNG export.
- Unit, contract, browser, accessibility, and deployment verification.
- The repository's own issue DAG as the live and offline example.

### Explicit limitations

- A dependency connection retrieves at most 100 nodes in the first release. The affected issue is marked partial when GitHub reports a larger connection.
- GraphQL cost and token permissions can prevent a full load; the application fails visibly.
- A canvas graph is not an accessible replacement for structured HTML. The issue list and inspector carry the accessible workflow.
- Very large graphs require measured performance limits and may need filtering before layout.
- The viewer is read-only. It does not mutate source repository issues or dependencies.

## Success criteria

- A new user can understand the implementation blueprint without a token.
- A repository with hundreds of issues loads all pages and preserves every retrieved native dependency.
- Ready and blocked states agree with GitHub issue state and incoming blockers.
- Cycles remain visible and inspectable instead of disappearing from layout.
- Desktop and mobile users can search, select, inspect, and return to the graph.
- No credential value is persisted or emitted by the application.
- The public Pages deployment is reproducible from the verified main revision.

## Non-goals

- Reconstructing dependencies from issue body text, task lists, labels, or Projects fields.
- Editing issues, labels, milestones, assignees, or dependencies.
- Acting as an OAuth application or token exchange service.
- Replacing GitHub Projects roadmap, table, or board views.
- Providing organization-wide portfolio aggregation in the first release.
