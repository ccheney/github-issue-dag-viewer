import { describe, expect, it } from 'vitest'
import { demoSnapshot } from '../src/demo/demo-data'
import {
  availableLabels,
  filterIssueKeys,
  formatFilterQuery,
  parseFilterQuery,
} from '../src/domain/filters'
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
      labels: new Set(['area:delivery']),
      showExternal: true,
    })

    expect([...results].toSorted()).toEqual(['ccheney/github-issue-dag-viewer#30'])
  })

  it('parses GitHub-style qualifiers without treating them as search text', () => {
    const parsed = parseFilterQuery('is:issue state:open is:ready label:"area:delivery" deployment')

    expect(parsed).toEqual({
      text: 'deployment',
      state: 'open',
      readiness: 'ready',
      labels: new Set(['area:delivery']),
      showExternal: true,
    })
  })

  it('formats menu selections as a GitHub-style query', () => {
    expect(
      formatFilterQuery({
        query: 'deployment',
        state: 'open',
        readiness: 'ready',
        labels: new Set(['area:delivery']),
        showExternal: false,
      }),
    ).toBe('is:issue deployment state:open is:ready label:"area:delivery" -is:external')
  })

  it('filters directly from GitHub-style qualifiers', () => {
    const query = 'is:issue state:open is:ready label:"area:delivery"'
    const parsed = parseFilterQuery(query)
    const results = filterIssueKeys(analysis, {
      query,
      state: parsed.state,
      readiness: parsed.readiness,
      labels: parsed.labels,
      showExternal: parsed.showExternal,
    })

    expect([...results]).toEqual(['ccheney/github-issue-dag-viewer#30'])
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
