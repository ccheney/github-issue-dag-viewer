# Graph domain and analysis

## Dependency invariant

GitHub expresses that issue B is blocked by issue A. The graph represents this as:

```text
A (blocker) -> B (blocked issue)
```

Every algorithm, label, arrow, relationship list, export, and test uses this direction. `blockedBy` contributes incoming edges; `blocking` contributes outgoing edges.

## Node identity

Use the lowercase repository name with issue number:

```text
owner/repository#123
```

Repository identity is required because native dependencies can cross repositories and issue numbers are unique only within a repository.

## Normalization

1. Add every issue in the loaded repository to the node map.
2. Inspect both dependency connections for every issue.
3. Synthesize a minimal external node when a referenced issue is outside the loaded repository.
4. Convert every relation to a blocker-source edge.
5. Deduplicate by `source->target` because GitHub can report the same relation through both ends.
6. Create incoming and outgoing adjacency sets for every node, including isolated nodes.

External nodes retain repository, number, title, state, and URL. They do not pretend to have local labels, bodies, actors, or complete relationships.

## Structural analysis

### Strongly connected components

Use Tarjan's algorithm over outgoing adjacency. A component is cyclic when it contains more than one node or a single node with a self-edge. Sort reported component members for deterministic tests and display.

Cycles are data errors, not reasons to drop nodes. They remain in the node map and are placed in a final deterministic layer when topological processing cannot consume them.

### Topological layers

Use Kahn's algorithm with incoming degree:

1. Start with all zero-degree nodes in lexical order.
2. Emit them as one layer.
3. Decrement each outgoing target's degree.
4. Continue until no acyclic nodes remain.
5. Emit remaining cyclic nodes as a deterministic final layer.

Record the layer index as node depth. Roots have no incoming edges. Sinks have no outgoing edges.

### Ready work

An issue is ready when:

- Its state is open.
- Every incoming blocker exists in the graph and is closed.

An open root is ready because its blocker set is empty. Closed issues are never ready. An open issue with an open external blocker is blocked.

### Critical path

Compute the longest path through open nodes in topological order. Closed nodes do not lengthen the active path. Cyclic nodes are excluded from the ordered critical-path calculation and remain separately visible as malformed work.

The result is an implementation-sequencing signal, not a duration estimate. Issue effort is unweighted.

### Reachability

Breadth-first traversal over incoming adjacency returns every transitive upstream blocker. Traversal over outgoing adjacency returns every downstream issue. Selection uses both sets to preserve local graph context while dimming unrelated nodes.

## Filtering semantics

- Text search matches title, repository, issue number, and label names.
- State is all, open, or closed.
- Readiness is all, ready, blocked, or cyclic.
- Label selection uses inclusive-any matching among selected labels.
- External-node visibility is independent of other filters.

Filtering changes the rendered subgraph and issue list. Analysis statistics describe the full loaded snapshot so filtering cannot silently redefine repository health.

## Rendering adapter

Cytoscape receives only nodes and edges whose endpoints both pass the current filter. Dagre lays out the resulting directed graph left-to-right or top-to-bottom. The adapter owns canvas lifecycle, layout, zoom, pan, selection, focus classes, fitting, and PNG output; it does not own graph semantics.

Semantic node states:

| State | Meaning |
| --- | --- |
| Ready | Open and every retrieved blocker is closed |
| Open | Open but not ready |
| Closed | Completed or otherwise closed on GitHub |
| External | Referenced from another repository and only partially known |
| Cyclic | Member of a dependency cycle |
| Critical | Member of the current open longest path |
| Selected | Active issue in list, graph, and inspector |

## Implementation blueprint

The ordered catalog in `src/demo/blueprint-*.ts` is the offline projection of this repository's live issue graph. Array order maps to issue number. Stable task IDs define dependencies without hard-coding issue numbers.

The projection must match the live repository for:

- Number and title.
- Open or closed state.
- Area label.
- Incoming blocker issue numbers.
- Total node and edge count.
- Ready queue, cycle count, layers, and critical path.

Temporary publication tooling is not part of the shipped application. Once the native issues and dependency links exist and have been validated, the plans and catalog remain as the durable source record.

## Graph acceptance criteria

- Duplicate API relationships produce one edge.
- Cross-repository issue numbers never collide with local nodes.
- Acyclic graphs receive stable layers and depth.
- Cycles and self-edges are reported without losing nodes.
- Ready work agrees with the state of every incoming blocker.
- Selection finds complete transitive upstream and downstream sets.
- The offline blueprint contains 38 nodes and 115 edges matching the live issue graph.
