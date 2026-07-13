import { type GraphAnalysis, type GraphEdge, type IssueRecord, issueKey } from './types'

const createAdjacency = (
  keys: readonly string[],
): { incoming: Map<string, Set<string>>; outgoing: Map<string, Set<string>> } => ({
  incoming: new Map(keys.map((key) => [key, new Set<string>()])),
  outgoing: new Map(keys.map((key) => [key, new Set<string>()])),
})

const externalIssue = (dependency: IssueRecord['blockedBy'][number]): IssueRecord => ({
  key: dependency.key,
  id: dependency.key,
  number: dependency.number,
  repository: dependency.repository,
  title: dependency.title,
  url: dependency.url,
  state: dependency.state,
  stateReason: null,
  body: null,
  author: null,
  assignees: [],
  labels: [],
  milestone: null,
  createdAt: '',
  updatedAt: '',
  closedAt: null,
  blockedBy: [],
  blocking: [],
  dependencyDataTruncated: false,
  isExternal: true,
})

const collectNodes = (issues: readonly IssueRecord[]): Map<string, IssueRecord> => {
  const nodes = new Map(issues.map((issue) => [issue.key, issue]))
  for (const issue of issues) {
    for (const dependency of [...issue.blockedBy, ...issue.blocking]) {
      if (!nodes.has(dependency.key)) nodes.set(dependency.key, externalIssue(dependency))
    }
  }
  return nodes
}

const collectEdges = (issues: readonly IssueRecord[]): GraphEdge[] => {
  const edges = new Map<string, GraphEdge>()
  const add = (source: string, target: string): void => {
    const id = `${source}->${target}`
    edges.set(id, { id, source, target })
  }

  for (const issue of issues) {
    for (const blocker of issue.blockedBy) add(blocker.key, issue.key)
    for (const blocked of issue.blocking) add(issue.key, blocked.key)
  }
  return [...edges.values()].toSorted((left, right) => left.id.localeCompare(right.id))
}

const populateAdjacency = (
  keys: readonly string[],
  edges: readonly GraphEdge[],
): { incoming: Map<string, Set<string>>; outgoing: Map<string, Set<string>> } => {
  const adjacency = createAdjacency(keys)
  for (const { source, target } of edges) {
    adjacency.outgoing.get(source)?.add(target)
    adjacency.incoming.get(target)?.add(source)
  }
  return adjacency
}

const stronglyConnectedComponents = (
  keys: readonly string[],
  outgoing: ReadonlyMap<string, ReadonlySet<string>>,
): string[][] => {
  const indexes = new Map<string, number>()
  const lowLinks = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const components: string[][] = []
  let index = 0

  const visit = (key: string): void => {
    indexes.set(key, index)
    lowLinks.set(key, index)
    index += 1
    stack.push(key)
    onStack.add(key)

    for (const neighbor of outgoing.get(key) ?? []) {
      if (!indexes.has(neighbor)) {
        visit(neighbor)
        lowLinks.set(key, Math.min(lowLinks.get(key) ?? 0, lowLinks.get(neighbor) ?? 0))
      } else if (onStack.has(neighbor)) {
        lowLinks.set(key, Math.min(lowLinks.get(key) ?? 0, indexes.get(neighbor) ?? 0))
      }
    }

    if (lowLinks.get(key) !== indexes.get(key)) return
    const component: string[] = []
    let member: string | undefined
    do {
      member = stack.pop()
      if (member !== undefined) {
        onStack.delete(member)
        component.push(member)
      }
    } while (member !== key)
    components.push(component)
  }

  for (const key of keys) if (!indexes.has(key)) visit(key)
  return components
}

const findCycles = (
  components: readonly (readonly string[])[],
  outgoing: ReadonlyMap<string, ReadonlySet<string>>,
): string[][] =>
  components
    .filter(
      (component) =>
        component.length > 1 || outgoing.get(component[0] ?? '')?.has(component[0] ?? ''),
    )
    .map((component) => [...component].toSorted())

const createLayers = (
  keys: readonly string[],
  incoming: ReadonlyMap<string, ReadonlySet<string>>,
  outgoing: ReadonlyMap<string, ReadonlySet<string>>,
): { layers: string[][]; order: string[]; depth: Map<string, number> } => {
  const degree = new Map(keys.map((key) => [key, incoming.get(key)?.size ?? 0]))
  const remaining = new Set(keys)
  const layers: string[][] = []
  const order: string[] = []
  const depth = new Map<string, number>()

  while (remaining.size > 0) {
    const layer = [...remaining].filter((key) => degree.get(key) === 0).toSorted()
    if (layer.length === 0) {
      const cyclic = [...remaining].toSorted()
      layers.push(cyclic)
      for (const key of cyclic) depth.set(key, layers.length - 1)
      break
    }
    layers.push(layer)
    for (const key of layer) {
      remaining.delete(key)
      order.push(key)
      depth.set(key, layers.length - 1)
      for (const target of outgoing.get(key) ?? []) {
        degree.set(target, (degree.get(target) ?? 1) - 1)
      }
    }
  }
  return { layers, order, depth }
}

const findCriticalPath = (
  order: readonly string[],
  nodes: ReadonlyMap<string, IssueRecord>,
  incoming: ReadonlyMap<string, ReadonlySet<string>>,
): string[] => {
  const scores = new Map<string, number>()
  const previous = new Map<string, string>()
  for (const key of order) {
    if (nodes.get(key)?.state !== 'OPEN') continue
    const candidates = [...(incoming.get(key) ?? [])].filter(
      (candidate) => nodes.get(candidate)?.state === 'OPEN',
    )
    const best = candidates.toSorted(
      (left, right) => (scores.get(right) ?? 0) - (scores.get(left) ?? 0),
    )[0]
    scores.set(key, (best === undefined ? 0 : (scores.get(best) ?? 0)) + 1)
    if (best !== undefined) previous.set(key, best)
  }

  const end = [...scores].toSorted((left, right) => right[1] - left[1])[0]?.[0]
  if (end === undefined) return []
  const path: string[] = []
  let current: string | undefined = end
  while (current !== undefined) {
    path.push(current)
    current = previous.get(current)
  }
  return path.toReversed()
}

export const analyzeGraph = (issues: readonly IssueRecord[]): GraphAnalysis => {
  const nodes = collectNodes(issues)
  const keys = [...nodes.keys()].toSorted()
  const edges = collectEdges(issues)
  const { incoming, outgoing } = populateAdjacency(keys, edges)
  const components = stronglyConnectedComponents(keys, outgoing)
  const cycles = findCycles(components, outgoing)
  const { layers, order, depth } = createLayers(keys, incoming, outgoing)
  const roots = new Set(keys.filter((key) => (incoming.get(key)?.size ?? 0) === 0))
  const sinks = new Set(keys.filter((key) => (outgoing.get(key)?.size ?? 0) === 0))
  const ready = new Set(
    keys.filter(
      (key) =>
        nodes.get(key)?.state === 'OPEN' &&
        [...(incoming.get(key) ?? [])].every((blocker) => nodes.get(blocker)?.state === 'CLOSED'),
    ),
  )
  const criticalPath = findCriticalPath(order, nodes, incoming)
  const open = keys.filter((key) => nodes.get(key)?.state === 'OPEN').length
  const blocked = keys.filter((key) => nodes.get(key)?.state === 'OPEN' && !ready.has(key)).length

  return {
    nodes,
    edges,
    incoming,
    outgoing,
    cycles,
    layers,
    ready,
    roots,
    sinks,
    criticalPath,
    depth,
    stats: {
      total: keys.length,
      open,
      closed: keys.length - open,
      ready: ready.size,
      blocked,
      roots: roots.size,
      sinks: sinks.size,
      cycles: cycles.length,
      maxDepth: Math.max(0, ...depth.values()),
    },
  }
}

export const relatedNodes = (
  start: string,
  adjacency: ReadonlyMap<string, ReadonlySet<string>>,
): Set<string> => {
  const related = new Set<string>()
  const queue = [...(adjacency.get(start) ?? [])]
  for (const key of queue) {
    if (related.has(key)) continue
    related.add(key)
    queue.push(...(adjacency.get(key) ?? []))
  }
  return related
}

export const keyForIssue = (repository: string, number: number): string =>
  issueKey(repository, number)
