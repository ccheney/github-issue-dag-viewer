import { describe, expect, it } from 'vitest'
import { demoSnapshot } from '../src/demo/demo-data'
import { analyzeGraph, relatedNodes } from '../src/domain/graph'
import type { DependencyRef, IssueRecord } from '../src/domain/types'
import { issueKey } from '../src/domain/types'

const repository = 'example/complex-dag'

const dependency = (number: number): DependencyRef => ({
  key: issueKey(repository, number),
  number,
  repository,
  state: 'OPEN',
  title: `Issue ${number}`,
  url: `https://github.com/${repository}/issues/${number}`,
})

const issue = (number: number, blockedBy: number[] = []): IssueRecord => ({
  key: issueKey(repository, number),
  id: `issue-${number}`,
  number,
  repository,
  title: `Issue ${number}`,
  url: `https://github.com/${repository}/issues/${number}`,
  state: 'OPEN',
  stateReason: null,
  body: null,
  author: null,
  assignees: [],
  labels: [],
  milestone: null,
  createdAt: '2026-07-12T00:00:00.000Z',
  updatedAt: '2026-07-12T00:00:00.000Z',
  closedAt: null,
  blockedBy: blockedBy.map(dependency),
  blocking: [],
  dependencyDataTruncated: false,
  isExternal: false,
})

describe('analyzeGraph', () => {
  it('analyzes the complex demo graph', () => {
    const graph = analyzeGraph(demoSnapshot.issues)

    expect(graph.stats).toMatchObject({ total: 38, open: 9, closed: 29, ready: 2, cycles: 0 })
    expect(graph.edges).toHaveLength(115)
    expect(graph.layers).toHaveLength(23)
    expect(graph.criticalPath).toHaveLength(6)
  })

  it('deduplicates relationships reported from both ends', () => {
    const first = { ...issue(1), blocking: [dependency(2)] }
    const graph = analyzeGraph([first, issue(2, [1])])

    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]).toMatchObject({ source: first.key, target: issueKey(repository, 2) })
  })

  it('detects cycles without losing their nodes', () => {
    const graph = analyzeGraph([issue(1, [2]), issue(2, [1]), issue(3, [2])])

    expect(graph.cycles).toEqual([[issueKey(repository, 1), issueKey(repository, 2)]])
    expect(graph.stats.total).toBe(3)
    expect(graph.stats.cycles).toBe(1)
  })

  it('finds all reachable issues in either direction', () => {
    const graph = analyzeGraph([issue(1), issue(2, [1]), issue(3, [2]), issue(4)])

    expect(relatedNodes(issueKey(repository, 1), graph.outgoing)).toEqual(
      new Set([issueKey(repository, 2), issueKey(repository, 3)]),
    )
  })
})
