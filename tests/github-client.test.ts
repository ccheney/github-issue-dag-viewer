import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RepositoryLoadUpdate } from '../src/domain/types'
import { fetchIssueBody, fetchRepositorySnapshot, GitHubGraphQlError } from '../src/github/client'
import {
  issueDetails,
  issueNode,
  jsonResponse,
  repository,
  repositoryPage,
  TEST_TOKEN,
} from './github-client-fixtures'

interface GraphQlRequestBody {
  query: string
  variables: Record<string, unknown>
}

const fetchMock = vi.fn<typeof fetch>()

const requestAt = (index: number): { body: GraphQlRequestBody; init: RequestInit } => {
  const init = fetchMock.mock.calls.at(index)?.[1]
  if (init === undefined || typeof init.body !== 'string') {
    throw new Error(`Missing request body for fetch call ${index}.`)
  }
  return { body: JSON.parse(init.body) as GraphQlRequestBody, init }
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchRepositorySnapshot', () => {
  it('transforms one page and marks truncated dependency connections', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        repositoryPage({
          nodes: [issueNode(1, { blockedByTotal: 2 })],
        }),
      ),
    )
    const onProgress = vi.fn<(update: RepositoryLoadUpdate) => void>()

    const snapshot = await fetchRepositorySnapshot(repository, TEST_TOKEN, onProgress)

    expect(snapshot.repository).toEqual(repository)
    expect(snapshot.issues).toHaveLength(1)
    expect(snapshot.issues[0]).toMatchObject({
      key: 'octo-org/roadmap#1',
      body: null,
      dependencyDataTruncated: true,
      isExternal: false,
    })
    expect(snapshot.issues[0]?.blockedBy[0]).toMatchObject({
      key: 'octo-org/roadmap#101',
      repository: 'octo-org/roadmap',
    })
    expect(onProgress).toHaveBeenCalledWith({
      progress: { loaded: 1, total: 1 },
      snapshot,
    })
    expect(requestAt(0)).toMatchObject({
      body: { variables: { owner: 'octo-org', name: 'roadmap', cursor: null } },
      init: {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
        method: 'POST',
      },
    })
    expect(JSON.stringify(snapshot)).not.toContain(TEST_TOKEN)
  })

  it('follows cursors and reports progress after every page', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          repositoryPage({
            nodes: [issueNode(1)],
            totalCount: 2,
            hasNextPage: true,
            endCursor: 'cursor-1',
          }),
        ),
      )
      .mockResolvedValueOnce(jsonResponse(repositoryPage({ nodes: [issueNode(2)], totalCount: 2 })))
    const onProgress = vi.fn<(update: RepositoryLoadUpdate) => void>()

    const snapshot = await fetchRepositorySnapshot(repository, TEST_TOKEN, onProgress)

    expect(snapshot.issues.map(({ number }) => number)).toEqual([1, 2])
    expect(requestAt(0).body.variables.cursor).toBeNull()
    expect(requestAt(1).body.variables.cursor).toBe('cursor-1')
    const updates = onProgress.mock.calls.map(([update]) => update)
    expect(updates.map(({ progress }) => progress)).toEqual([
      { loaded: 1, total: 2 },
      { loaded: 2, total: 2 },
    ])
    expect(
      updates.map(({ snapshot: partial }) => partial.issues.map(({ number }) => number)),
    ).toEqual([[1], [1, 2]])
  })

  it('rejects an inaccessible repository with a bounded message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          repository: null,
          rateLimit: { cost: 1, remaining: 5, resetAt: '2026-07-12T14:00:00Z' },
        },
      }),
    )

    await expect(fetchRepositorySnapshot(repository, TEST_TOKEN, vi.fn())).rejects.toThrow(
      'Repository not found or the token cannot access it.',
    )
  })

  it.each([
    ['HTTP failure', jsonResponse({ errors: [{ message: TEST_TOKEN }] }, 401), 'HTTP 401'],
    [
      'GraphQL failure',
      jsonResponse({ data: null, errors: [{ message: TEST_TOKEN }] }),
      'GitHub rejected the GraphQL request.',
    ],
    [
      'schema drift',
      jsonResponse({
        data: {
          repository: { issues: { nodes: 'invalid' } },
          rateLimit: { cost: 1, remaining: 5, resetAt: '2026-07-12T14:00:00Z' },
        },
      }),
      'unexpected issue dependency response',
    ],
  ])('bounds %s without exposing authorization values', async (_name, response, message) => {
    fetchMock.mockResolvedValue(response)

    const error = await fetchRepositorySnapshot(repository, TEST_TOKEN, vi.fn()).catch(
      (reason: unknown) => reason,
    )

    expect(error).toBeInstanceOf(GitHubGraphQlError)
    expect(String(error)).toContain(message)
    expect(String(error)).not.toContain(TEST_TOKEN)
  })

  it('bounds a non-JSON response', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 502 }))

    await expect(fetchRepositorySnapshot(repository, TEST_TOKEN, vi.fn())).rejects.toThrow(
      'GitHub returned HTTP 502.',
    )
  })

  it.each([null, 'cursor-1'])('rejects a missing or repeated pagination cursor', async (cursor) => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          repositoryPage({
            nodes: [issueNode(1)],
            hasNextPage: true,
            endCursor: cursor,
          }),
        ),
      ),
    )

    await expect(fetchRepositorySnapshot(repository, TEST_TOKEN, vi.fn())).rejects.toThrow(
      'GitHub returned invalid pagination metadata.',
    )
    expect(fetchMock).toHaveBeenCalledTimes(cursor === null ? 1 : 2)
  })

  it('forwards cancellation to fetch', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockImplementation((_input, init) => {
      expect(init?.signal).toBe(controller.signal)
      return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'))
    })

    await expect(
      fetchRepositorySnapshot(repository, TEST_TOKEN, vi.fn(), controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('fetchIssueBody', () => {
  it('loads the selected issue body without returning the token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(issueDetails('## Details')))

    const body = await fetchIssueBody(repository, 42, TEST_TOKEN)

    expect(body).toBe('## Details')
    expect(body).not.toContain(TEST_TOKEN)
    expect(requestAt(0).body.variables).toEqual({ owner: 'octo-org', name: 'roadmap', number: 42 })
  })

  it('reports an issue that disappeared before lazy loading', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          repository: { issue: null },
          rateLimit: { cost: 1, remaining: 5, resetAt: '2026-07-12T14:00:00Z' },
        },
      }),
    )

    await expect(fetchIssueBody(repository, 42, TEST_TOKEN)).rejects.toThrow(
      'Issue #42 is no longer available.',
    )
  })
})
