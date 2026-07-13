import type { RepositoryRef } from '../src/domain/types'

export const TEST_TOKEN = 'contract-test-secret-token'

export const repository: RepositoryRef = {
  owner: 'octo-org',
  name: 'roadmap',
  nameWithOwner: 'octo-org/roadmap',
  url: 'https://github.com/octo-org/roadmap',
}

const actor = {
  login: 'monalisa',
  avatarUrl: 'https://github.com/monalisa.png',
  url: 'https://github.com/monalisa',
}

const dependency = (number: number) => ({
  number,
  state: 'CLOSED' as const,
  title: `Dependency ${number}`,
  url: `https://github.com/octo-org/roadmap/issues/${number}`,
  repository: { nameWithOwner: 'octo-org/roadmap' },
})

export const issueNode = (
  number: number,
  options: { blockedByTotal?: number; blockingTotal?: number } = {},
) => ({
  id: `issue-${number}`,
  number,
  title: `Issue ${number}`,
  url: `https://github.com/octo-org/roadmap/issues/${number}`,
  state: 'OPEN' as const,
  stateReason: null,
  createdAt: '2026-07-12T12:00:00Z',
  updatedAt: '2026-07-12T13:00:00Z',
  closedAt: null,
  author: actor,
  assignees: { nodes: [actor] },
  labels: {
    nodes: [{ name: 'area:test', color: '0969da', description: 'Contract test' }],
  },
  milestone: null,
  blockedBy: {
    totalCount: options.blockedByTotal ?? 1,
    nodes: [dependency(number + 100)],
  },
  blocking: {
    totalCount: options.blockingTotal ?? 1,
    nodes: [dependency(number + 200)],
  },
})

export const repositoryPage = ({
  nodes,
  totalCount = nodes.length,
  hasNextPage = false,
  endCursor = null,
}: {
  nodes: ReturnType<typeof issueNode>[]
  totalCount?: number
  hasNextPage?: boolean
  endCursor?: string | null
}) => ({
  data: {
    repository: {
      nameWithOwner: repository.nameWithOwner,
      url: repository.url,
      description: 'A repository used by contract tests',
      isPrivate: false,
      issues: {
        totalCount,
        pageInfo: { hasNextPage, endCursor },
        nodes,
      },
    },
    rateLimit: { cost: 1, remaining: 4_999, resetAt: '2026-07-12T14:00:00Z' },
  },
})

export const issueDetails = (body: string) => ({
  data: {
    repository: {
      issue: { number: 42, body, updatedAt: '2026-07-12T13:00:00Z' },
    },
    rateLimit: { cost: 1, remaining: 4_999, resetAt: '2026-07-12T14:00:00Z' },
  },
})

export const jsonResponse = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
