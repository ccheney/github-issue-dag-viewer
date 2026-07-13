import type { ZodType } from 'zod'
import type { RepositoryLoadUpdate, RepositoryRef, RepositorySnapshot } from '../domain/types'
import { type DependencyRef, type IssueRecord, issueKey } from '../domain/types'
import { issueDetailsSchema, type RepositoryPageResponse, repositoryPageSchema } from './schemas'

const GRAPHQL_ENDPOINT = 'https://api.github.com/graphql'

const REPOSITORY_PAGE_QUERY = `
  query RepositoryIssueDependencies($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      url
      description
      isPrivate
      issues(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: ASC}) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          id number title url state stateReason createdAt updatedAt closedAt
          author { login avatarUrl url }
          assignees(first: 20) { nodes { login avatarUrl url } }
          labels(first: 50) { nodes { name color description } }
          milestone { title url }
          blockedBy(first: 100) {
            totalCount
            nodes { number state title url repository { nameWithOwner } }
          }
          blocking(first: 100) {
            totalCount
            nodes { number state title url repository { nameWithOwner } }
          }
        }
      }
    }
    rateLimit { cost remaining resetAt }
  }
`

const ISSUE_DETAILS_QUERY = `
  query IssueDetails($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $number) { number body updatedAt }
    }
    rateLimit { cost remaining resetAt }
  }
`

interface GraphQlEnvelope {
  data?: unknown
  errors?: unknown[]
}

export class GitHubGraphQlError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'GitHubGraphQlError'
  }
}

const request = async <T>(
  token: string,
  query: string,
  variables: Readonly<Record<string, unknown>>,
  schema: ZodType<T>,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2026-03-10',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
    ...(signal === undefined ? {} : { signal }),
  })

  let envelope: GraphQlEnvelope
  try {
    envelope = (await response.json()) as GraphQlEnvelope
  } catch {
    throw new GitHubGraphQlError(
      response.ok
        ? 'GitHub returned an unexpected GraphQL response.'
        : `GitHub returned HTTP ${response.status}.`,
    )
  }
  if (!response.ok) {
    throw new GitHubGraphQlError(`GitHub returned HTTP ${response.status}.`)
  }
  if (envelope.data === undefined || (envelope.errors?.length ?? 0) > 0) {
    throw new GitHubGraphQlError('GitHub rejected the GraphQL request.')
  }

  const result = schema.safeParse(envelope.data)
  if (!result.success) {
    throw new GitHubGraphQlError('GitHub returned an unexpected issue dependency response.')
  }
  return result.data
}

const dependencyRef = (dependency: {
  number: number
  repository: { nameWithOwner: string }
  state: 'OPEN' | 'CLOSED'
  title: string
  url: string
}): DependencyRef => ({
  ...dependency,
  repository: dependency.repository.nameWithOwner,
  key: issueKey(dependency.repository.nameWithOwner, dependency.number),
})

const issueRecord = (
  repository: string,
  issue: NonNullable<RepositoryPageResponse['repository']>['issues']['nodes'][number],
): IssueRecord => ({
  ...issue,
  key: issueKey(repository, issue.number),
  repository,
  body: null,
  assignees: issue.assignees.nodes,
  labels: issue.labels.nodes,
  blockedBy: issue.blockedBy.nodes.map(dependencyRef),
  blocking: issue.blocking.nodes.map(dependencyRef),
  dependencyDataTruncated:
    issue.blockedBy.totalCount > issue.blockedBy.nodes.length ||
    issue.blocking.totalCount > issue.blocking.nodes.length,
  isExternal: false,
})

export const fetchRepositorySnapshot = async (
  repository: RepositoryRef,
  token: string,
  onUpdate: (update: RepositoryLoadUpdate) => void,
  signal?: AbortSignal,
): Promise<RepositorySnapshot> => {
  const issues: IssueRecord[] = []
  const fetchedAt = new Date().toISOString()
  let cursor: string | null = null
  let hasNextPage = true
  let snapshot: RepositorySnapshot | null = null

  while (hasNextPage) {
    const page: RepositoryPageResponse = await request(
      token,
      REPOSITORY_PAGE_QUERY,
      { owner: repository.owner, name: repository.name, cursor },
      repositoryPageSchema,
      signal,
    )
    if (page.repository === null) {
      throw new GitHubGraphQlError('Repository not found or the token cannot access it.')
    }

    const { issues: connection, ...repositoryData } = page.repository
    issues.push(
      ...connection.nodes.map((issue) => issueRecord(repositoryData.nameWithOwner, issue)),
    )
    snapshot = {
      repository: {
        owner: repository.owner,
        name: repository.name,
        nameWithOwner: repositoryData.nameWithOwner,
        url: repositoryData.url,
      },
      description: repositoryData.description,
      isPrivate: repositoryData.isPrivate,
      issues: [...issues],
      fetchedAt,
      rateLimit: page.rateLimit,
    }
    onUpdate({
      progress: { loaded: issues.length, total: connection.totalCount },
      snapshot,
    })
    const nextCursor = connection.pageInfo.endCursor
    hasNextPage = connection.pageInfo.hasNextPage
    if (hasNextPage && (nextCursor === null || nextCursor === cursor)) {
      throw new GitHubGraphQlError('GitHub returned invalid pagination metadata.')
    }
    cursor = nextCursor
  }

  if (snapshot === null) {
    throw new GitHubGraphQlError('GitHub returned no repository data.')
  }
  return snapshot
}

export const fetchIssueBody = async (
  repository: RepositoryRef,
  number: number,
  token: string,
  signal?: AbortSignal,
): Promise<string> => {
  const result = await request(
    token,
    ISSUE_DETAILS_QUERY,
    { owner: repository.owner, name: repository.name, number },
    issueDetailsSchema,
    signal,
  )
  const issue = result.repository?.issue
  if (issue === null || issue === undefined) {
    throw new GitHubGraphQlError(`Issue #${number} is no longer available.`)
  }
  return issue.body
}
