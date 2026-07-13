# Large-graph benchmark

Measured on July 12, 2026 (America/Chicago) with Bun 1.3.14 on an Apple M2 Max with 64 GiB of memory and macOS 27.0. Run with:

```sh
bun run benchmark:graphs
```

The deterministic matrix uses three 999/4,999-edge shapes at 1,000 and 5,000 nodes:

- `sparse-chain`: one deep dependency chain.
- `fan-out`: one root blocks every other issue.
- `fan-in`: every other issue blocks one sink.

Each case measures fixture construction, repository-independent domain analysis, Dagre layout, one reachability-plus-filter interaction, process memory, and JSON export. PNG figures are the dimensions and raw RGBA allocation implied by the viewer's existing 6,000 × 6,000 export cap; they do not claim browser encoding time. The cases run sequentially, so RSS is a process upper envelope and can retain allocator pages from earlier cases.

## Measurements

| Shape | Nodes | Analysis | Dagre layout | Interaction | Heap used | RSS | JSON export |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sparse chain | 1,000 | 11.54 ms | 854.71 ms | 11.82 ms | 30.62 MiB | 173.39 MiB | 0.84 MiB in 0.94 ms |
| Sparse chain | 5,000 | 144.91 ms | **Failed after 11.38 s** | 56.46 ms | 145.72 MiB | 467.83 MiB | 4.24 MiB in 4.29 ms |
| Fan-out | 1,000 | 2.21 ms | 287.44 ms | 10.94 ms | 155.93 MiB | 687.00 MiB | 0.82 MiB in 0.68 ms |
| Fan-out | 5,000 | 12.21 ms | 5.00 s | 51.56 ms | 141.91 MiB | 814.38 MiB | 4.11 MiB in 3.89 ms |
| Fan-in | 1,000 | 2.37 ms | 358.26 ms | 10.57 ms | 158.51 MiB | 825.61 MiB | 0.83 MiB in 0.68 ms |
| Fan-in | 5,000 | 11.83 ms | 6.11 s | 52.03 ms | 149.65 MiB | 850.48 MiB | 4.19 MiB in 4.08 ms |

The 5,000-node sparse chain reaches Dagre's recursive ordering limit and throws `RangeError: Maximum call stack size exceeded`. Domain analysis and JSON export still complete.

## Layout and PNG behavior

| Shape | Nodes | Uncapped layout extent | Capped PNG extent | Raw RGBA estimate |
| --- | ---: | ---: | ---: | ---: |
| Sparse chain | 1,000 | 280,006 × 162 | 6,000 × 162 | 3.71 MiB |
| Sparse chain | 5,000 | Layout failed | No export | 0 MiB |
| Fan-out | 1,000 | 566 × 93,974 | 566 × 6,000 | 12.95 MiB |
| Fan-out | 5,000 | 566 × 469,974 | 566 × 6,000 | 12.95 MiB |
| Fan-in | 1,000 | 566 × 93,974 | 566 × 6,000 | 12.95 MiB |
| Fan-in | 5,000 | 566 × 469,974 | 566 × 6,000 | 12.95 MiB |

The current cap prevents an unbounded bitmap allocation, but it crops most large layouts and therefore cannot be presented as a faithful full-graph export.

## Budgets and guardrails

The first release uses these defaults:

- Up to 1,000 nodes: Dagre runs automatically, animation is disabled at the existing 500-element threshold, and the targets are analysis under 50 ms, layout under 1 second, and interaction under 20 ms on the reference machine.
- 1,001–5,000 nodes: the graph library and layout stay paused behind explicit user consent. List, filter, detail, and JSON workflows remain available before layout.
- Above 5,000 nodes: full-canvas layout is disabled until an alternative layout or virtualization strategy has measured evidence.
- Full PNG export is disabled when either visible layout dimension exceeds 6,000 pixels. The viewer explains the limit and keeps JSON export available.
- Never retry the same failed Dagre layout automatically; a deep graph can spend more than 11 seconds before throwing.

Layout failures are caught and surfaced without removing the issue list or JSON export. The benchmark does not hide product limits by raising timeouts or warning thresholds.

## Bundle delivery

The production build separates the shell, graph renderer, and Markdown renderer through static dynamic-import boundaries. Vite keeps their shared dependencies optimized while allowing large repositories to avoid downloading Cytoscape and Dagre until the user requests layout.

| Asset | Measured gzip | Enforced budget |
| --- | ---: | ---: |
| Application entry | 202.7 KiB | 215 KiB |
| Cytoscape and Dagre graph chunk | 152.4 KiB | 165 KiB |
| Markdown renderer chunk | 44.8 KiB | 50 KiB |
| Total JavaScript | 399.9 KiB | 420 KiB |
| CSS | 48.1 KiB | 52 KiB |

Before splitting, the single application JavaScript entry was 398.6 KiB gzip. The shell entry is now 49% smaller while total capability remains within the 420 KiB JavaScript budget. `bun run check:bundle` reads the Vite manifest and fails when a boundary disappears or any compressed budget is exceeded.

## Reproduction notes

- Results are local reference measurements, not cross-browser guarantees.
- Browser heap, canvas encoding time, pan/zoom frame time, and device-specific GPU behavior remain part of browser and visual verification.
- Re-run the matrix after graph-library upgrades, layout strategy changes, or performance guardrail changes.
