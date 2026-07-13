import type { DependencyRef, IssueRecord } from '../src/domain/types'
import { issueKey } from '../src/domain/types'

export type LargeGraphShape = 'fan-in' | 'fan-out' | 'sparse-chain'

const REPOSITORY = 'benchmark/large-graph'

const dependency = (number: number): DependencyRef => ({
  key: issueKey(REPOSITORY, number),
  number,
  repository: REPOSITORY,
  state: 'OPEN',
  title: `Benchmark issue ${number}`,
  url: `https://github.com/${REPOSITORY}/issues/${number}`,
})

const blockersFor = (shape: LargeGraphShape, number: number, size: number): number[] => {
  if (number === 1) return []
  if (shape === 'fan-out') return [1]
  if (shape === 'fan-in')
    return number === size ? Array.from({ length: size - 1 }, (_, i) => i + 1) : []
  return [number - 1]
}

const issue = (shape: LargeGraphShape, number: number, size: number): IssueRecord => ({
  key: issueKey(REPOSITORY, number),
  id: `benchmark-${shape}-${number}`,
  number,
  repository: REPOSITORY,
  title: `Benchmark issue ${number}`,
  url: `https://github.com/${REPOSITORY}/issues/${number}`,
  state: 'OPEN',
  stateReason: null,
  body: null,
  author: null,
  assignees: [],
  labels: [{ name: `shape:${shape}`, color: '0969da', description: null }],
  milestone: null,
  createdAt: '2026-07-12T00:00:00.000Z',
  updatedAt: '2026-07-12T00:00:00.000Z',
  closedAt: null,
  blockedBy: blockersFor(shape, number, size).map(dependency),
  blocking: [],
  dependencyDataTruncated: false,
  isExternal: false,
})

export const createLargeGraphFixture = (shape: LargeGraphShape, size: number): IssueRecord[] =>
  Array.from({ length: size }, (_, index) => issue(shape, index + 1, size))
