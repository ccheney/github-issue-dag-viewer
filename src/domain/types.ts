export type IssueState = 'OPEN' | 'CLOSED'

export interface RepositoryRef {
  owner: string
  name: string
  nameWithOwner: string
  url: string
}

export interface IssueLabel {
  name: string
  color: string
  description: string | null
}

export interface IssueActor {
  login: string
  avatarUrl: string
  url: string
}

export interface DependencyRef {
  key: string
  number: number
  repository: string
  state: IssueState
  title: string
  url: string
}

export interface IssueRecord {
  key: string
  id: string
  number: number
  repository: string
  title: string
  url: string
  state: IssueState
  stateReason: string | null
  body: string | null
  author: IssueActor | null
  assignees: IssueActor[]
  labels: IssueLabel[]
  milestone: { title: string; url: string } | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  blockedBy: DependencyRef[]
  blocking: DependencyRef[]
  dependencyDataTruncated: boolean
  isExternal: boolean
}

export interface RateLimit {
  cost: number
  remaining: number
  resetAt: string
}

export interface RepositorySnapshot {
  repository: RepositoryRef
  description: string | null
  isPrivate: boolean
  issues: IssueRecord[]
  fetchedAt: string
  rateLimit: RateLimit | null
}

export interface GraphEdge {
  id: string
  source: string
  target: string
}

export interface GraphStats {
  total: number
  open: number
  closed: number
  ready: number
  blocked: number
  roots: number
  sinks: number
  cycles: number
  maxDepth: number
}

export interface GraphAnalysis {
  nodes: ReadonlyMap<string, IssueRecord>
  edges: readonly GraphEdge[]
  incoming: ReadonlyMap<string, ReadonlySet<string>>
  outgoing: ReadonlyMap<string, ReadonlySet<string>>
  cycles: readonly (readonly string[])[]
  layers: readonly (readonly string[])[]
  ready: ReadonlySet<string>
  roots: ReadonlySet<string>
  sinks: ReadonlySet<string>
  criticalPath: readonly string[]
  depth: ReadonlyMap<string, number>
  stats: GraphStats
}

export type IssueStateFilter = 'all' | 'open' | 'closed'
export type ReadinessFilter = 'all' | 'ready' | 'blocked' | 'cyclic'

export interface GraphFilters {
  query: string
  state: IssueStateFilter
  readiness: ReadinessFilter
  labels: ReadonlySet<string>
  showExternal: boolean
}

export interface LoadProgress {
  loaded: number
  total: number
}

export interface RepositoryLoadUpdate {
  progress: LoadProgress
  snapshot: RepositorySnapshot
}

export const issueKey = (repository: string, number: number): string =>
  `${repository.toLowerCase()}#${number}`
