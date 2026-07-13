import type { GraphAnalysis, GraphFilters, IssueRecord } from './types'

const normalized = (value: string): string => value.trim().toLocaleLowerCase()

export interface ParsedFilterQuery {
  text: string
  state: GraphFilters['state']
  readiness: GraphFilters['readiness']
  labels: Set<string>
  showExternal: boolean
}

export const parseFilterQuery = (query: string): ParsedFilterQuery => {
  const parsed: ParsedFilterQuery = {
    text: '',
    state: 'all',
    readiness: 'all',
    labels: new Set(),
    showExternal: true,
  }
  const text: string[] = []
  const tokens = query.match(/[^\s"]+:"[^"]*"|"[^"]*"|\S+/g) ?? []

  for (const token of tokens) {
    const qualifier = token.toLocaleLowerCase()
    if (qualifier === 'is:issue') continue
    if (qualifier === 'state:open' || qualifier === 'state:closed') {
      parsed.state = qualifier === 'state:open' ? 'open' : 'closed'
      continue
    }
    if (qualifier === 'is:ready' || qualifier === 'is:blocked' || qualifier === 'is:cyclic') {
      parsed.readiness = qualifier.slice(3) as GraphFilters['readiness']
      continue
    }
    if (qualifier === '-is:external') {
      parsed.showExternal = false
      continue
    }
    const label = token.match(/^label:(?:"([^"]+)"|(\S+))$/i)
    if (label !== null) {
      parsed.labels.add(label[1] ?? label[2] ?? '')
      continue
    }
    text.push(token.replace(/^"|"$/g, ''))
  }

  parsed.text = text.join(' ').trim()
  return parsed
}

export const formatFilterQuery = (filters: GraphFilters): string => {
  const text = parseFilterQuery(filters.query).text
  return [
    'is:issue',
    text,
    filters.state === 'all' ? '' : `state:${filters.state}`,
    filters.readiness === 'all' ? '' : `is:${filters.readiness}`,
    ...[...filters.labels].toSorted().map((label) => `label:"${label}"`),
    filters.showExternal ? '' : '-is:external',
  ]
    .filter(Boolean)
    .join(' ')
}

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

export const filterIssueKeys = (analysis: GraphAnalysis, filters: GraphFilters): Set<string> => {
  const query = parseFilterQuery(filters.query).text
  return new Set(
    [...analysis.nodes.values()]
      .filter((issue) => filters.showExternal || !issue.isExternal)
      .filter((issue) => matchesQuery(issue, query))
      .filter((issue) => matchesState(issue, filters.state))
      .filter((issue) => matchesReadiness(issue, filters.readiness, analysis))
      .filter((issue) => matchesLabels(issue, filters.labels))
      .map(({ key }) => key),
  )
}

export const availableLabels = (analysis: GraphAnalysis): string[] =>
  [
    ...new Set(
      [...analysis.nodes.values()].flatMap(({ labels }) => labels.map(({ name }) => name)),
    ),
  ].toSorted((left, right) => left.localeCompare(right))
