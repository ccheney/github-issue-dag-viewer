import { describe, expect, it } from 'vitest'
import { createLargeGraphFixture, type LargeGraphShape } from '../scripts/large-graph-fixtures'
import { analyzeGraph } from '../src/domain/graph'

const shapes: LargeGraphShape[] = ['sparse-chain', 'fan-out', 'fan-in']

describe('large graph benchmark fixtures', () => {
  it.each(shapes)('creates a deterministic %s graph', (shape) => {
    const first = createLargeGraphFixture(shape, 12)
    const second = createLargeGraphFixture(shape, 12)
    const graph = analyzeGraph(first)

    expect(first).toEqual(second)
    expect(graph.edges).toHaveLength(11)
    expect(graph.stats).toMatchObject({ cycles: 0, total: 12 })
  })

  it('preserves the expected topology depths', () => {
    expect(analyzeGraph(createLargeGraphFixture('sparse-chain', 12)).stats.maxDepth).toBe(11)
    expect(analyzeGraph(createLargeGraphFixture('fan-out', 12)).stats.maxDepth).toBe(1)
    expect(analyzeGraph(createLargeGraphFixture('fan-in', 12)).stats.maxDepth).toBe(1)
  })
})
