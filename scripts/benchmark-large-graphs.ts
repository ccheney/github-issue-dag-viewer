import dagre from 'dagre'
import { filterIssueKeys } from '../src/domain/filters'
import { analyzeGraph, relatedNodes } from '../src/domain/graph'
import type { GraphAnalysis } from '../src/domain/types'
import { createLargeGraphFixture, type LargeGraphShape } from './large-graph-fixtures'

interface Measurement {
  shape: LargeGraphShape
  nodes: number
  edges: number
  fixtureMs: number
  analysisMs: number
  layoutMs: number
  layoutError: string | null
  interactionMs: number
  heapDeltaMiB: number
  heapUsedMiB: number
  rssMiB: number
  jsonExportMs: number
  jsonExportMiB: number
  layoutWidth: number
  layoutHeight: number
  pngWidth: number
  pngHeight: number
  pngRawMiB: number
}

const elapsed = (startedAt: number): number => performance.now() - startedAt
const mib = (bytes: number): number => bytes / 1_048_576
const rounded = (value: number): number => Number(value.toFixed(2))

const layoutGraph = (analysis: GraphAnalysis): { height: number; width: number } => {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'LR', ranksep: 90, nodesep: 28, edgesep: 14, marginx: 48, marginy: 48 })
  graph.setDefaultEdgeLabel(() => ({}))
  for (const key of analysis.nodes.keys()) graph.setNode(key, { width: 190, height: 66 })
  for (const { source, target } of analysis.edges) graph.setEdge(source, target)
  dagre.layout(graph)
  const dimensions = graph.graph()
  return { width: dimensions.width ?? 0, height: dimensions.height ?? 0 }
}

const exerciseInteractions = (analysis: GraphAnalysis, selectedKey: string): number => {
  const startedAt = performance.now()
  relatedNodes(selectedKey, analysis.incoming)
  relatedNodes(selectedKey, analysis.outgoing)
  filterIssueKeys(analysis, {
    query: 'benchmark issue 49',
    state: 'open',
    readiness: 'all',
    labels: new Set(),
    showExternal: true,
  })
  return elapsed(startedAt)
}

const exportMetrics = (analysis: GraphAnalysis): { bytes: number; durationMs: number } => {
  const startedAt = performance.now()
  const serialized = JSON.stringify({
    issues: [...analysis.nodes.values()],
    edges: analysis.edges,
  })
  return { bytes: Buffer.byteLength(serialized), durationMs: elapsed(startedAt) }
}

const measure = (shape: LargeGraphShape, nodes: number): Measurement => {
  const heapBefore = process.memoryUsage().heapUsed
  const fixtureStartedAt = performance.now()
  const issues = createLargeGraphFixture(shape, nodes)
  const fixtureMs = elapsed(fixtureStartedAt)

  const analysisStartedAt = performance.now()
  const analysis = analyzeGraph(issues)
  const analysisMs = elapsed(analysisStartedAt)

  const layoutStartedAt = performance.now()
  let layout = { height: 0, width: 0 }
  let layoutError: string | null = null
  try {
    layout = layoutGraph(analysis)
  } catch (error) {
    layoutError =
      error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown layout error'
  }
  const layoutMs = elapsed(layoutStartedAt)
  const selectedKey = [...analysis.nodes.keys()].at(Math.floor(nodes / 2)) ?? ''
  const interactionMs = exerciseInteractions(analysis, selectedKey)
  const exportResult = exportMetrics(analysis)
  const memory = process.memoryUsage()
  const heapDeltaMiB = Math.max(0, mib(memory.heapUsed - heapBefore))
  const pngWidth = Math.min(6_000, Math.ceil(layout.width))
  const pngHeight = Math.min(6_000, Math.ceil(layout.height))

  return {
    shape,
    nodes,
    edges: analysis.edges.length,
    fixtureMs: rounded(fixtureMs),
    analysisMs: rounded(analysisMs),
    layoutMs: rounded(layoutMs),
    layoutError,
    interactionMs: rounded(interactionMs),
    heapDeltaMiB: rounded(heapDeltaMiB),
    heapUsedMiB: rounded(mib(memory.heapUsed)),
    rssMiB: rounded(mib(memory.rss)),
    jsonExportMs: rounded(exportResult.durationMs),
    jsonExportMiB: rounded(mib(exportResult.bytes)),
    layoutWidth: Math.ceil(layout.width),
    layoutHeight: Math.ceil(layout.height),
    pngWidth,
    pngHeight,
    pngRawMiB: rounded(mib(pngWidth * pngHeight * 4)),
  }
}

const sizes = [1_000, 5_000]
const shapes: LargeGraphShape[] = ['sparse-chain', 'fan-out', 'fan-in']
const measurements = shapes.flatMap((shape) => sizes.map((size) => measure(shape, size)))

console.log(
  JSON.stringify(
    {
      runtime: process.versions.bun ?? process.version,
      measuredAt: new Date().toISOString(),
      measurements,
    },
    null,
    2,
  ),
)
