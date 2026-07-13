import { describe, expect, it } from 'vitest'
import { demoSnapshot } from '../src/demo/demo-data'
import { availableLabels, filterIssueKeys } from '../src/domain/filters'
import { analyzeGraph } from '../src/domain/graph'

const analysis = analyzeGraph(demoSnapshot.issues)

describe('issue filters', () => {
  it('searches titles, numbers, repositories, and labels', () => {
    const results = filterIssueKeys(analysis, {
      query: 'critical path',
      state: 'all',
      readiness: 'all',
      labels: new Set(),
      showExternal: true,
    })

    expect([...results]).toEqual(['ccheney/github-issue-dag-viewer#16'])
  })

  it('combines state, readiness, and label filters', () => {
    const results = filterIssueKeys(analysis, {
      query: '',
      state: 'open',
      readiness: 'ready',
      labels: new Set(['area:quality']),
      showExternal: true,
    })

    expect([...results].toSorted()).toEqual(['ccheney/github-issue-dag-viewer#27'])
  })

  it('returns a stable sorted label catalog', () => {
    expect(availableLabels(analysis)).toEqual([
      'area:api',
      'area:delivery',
      'area:docs',
      'area:foundation',
      'area:graph',
      'area:performance',
      'area:quality',
      'area:security',
      'area:ui',
    ])
  })
})
