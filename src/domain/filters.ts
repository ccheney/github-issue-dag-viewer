import type { GraphAnalysis, GraphFilters, IssueRecord } from './types'

const normalized = (value: string): string => value.trim().toLocaleLowerCase()

const matchesQuery = (issue: IssueRecord, query: string): boolean => {
  const term = normalized(query)
  if (term.length === 0) return true
  return [
    issue.title,
    issue.repository,
    `#${issue.number}`,
    ...issue.labels.map(({ name }) => name),
  ].some((value) => normalized(value).includes(term))
}

const matchesState = (issue: IssueRecord, state: GraphFilters['state']): boolean =>
  state === 'all' || issue.state.toLocaleLowerCase() === state

const isCyclic = (key: string, analysis: GraphAnalysis): boolean =>
  analysis.cycles.some((cycle) => cycle.includes(key))

const matchesReadiness = (
  issue: IssueRecord,
  readiness: GraphFilters['readiness'],
  analysis: GraphAnalysis,
): boolean => {
  if (readiness === 'all') return true
  if (readiness === 'cyclic') return isCyclic(issue.key, analysis)
  if (issue.state === 'CLOSED') return false
  return readiness === 'ready' ? analysis.ready.has(issue.key) : !analysis.ready.has(issue.key)
}

const matchesLabels = (issue: IssueRecord, labels: ReadonlySet<string>): boolean =>
  labels.size === 0 || issue.labels.some(({ name }) => labels.has(name))

export const filterIssueKeys = (analysis: GraphAnalysis, filters: GraphFilters): Set<string> =>
  new Set(
    [...analysis.nodes.values()]
      .filter((issue) => filters.showExternal || !issue.isExternal)
      .filter((issue) => matchesQuery(issue, filters.query))
      .filter((issue) => matchesState(issue, filters.state))
      .filter((issue) => matchesReadiness(issue, filters.readiness, analysis))
      .filter((issue) => matchesLabels(issue, filters.labels))
      .map(({ key }) => key),
  )

export const availableLabels = (analysis: GraphAnalysis): string[] =>
  [
    ...new Set(
      [...analysis.nodes.values()].flatMap(({ labels }) => labels.map(({ name }) => name)),
    ),
  ].toSorted((left, right) => left.localeCompare(right))
