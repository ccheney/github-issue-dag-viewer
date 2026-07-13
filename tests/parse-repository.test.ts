import { describe, expect, it } from 'vitest'
import { parseRepositoryInput, RepositoryInputError } from '../src/github/parse-repository'

describe('parseRepositoryInput', () => {
  it.each([
    ['owner/repo', 'owner/repo'],
    ['https://github.com/owner/repo/issues/14', 'owner/repo'],
    ['git@github.com:owner/repo.git', 'owner/repo'],
  ])('parses %s', (input, expected) => {
    expect(parseRepositoryInput(input).nameWithOwner).toBe(expected)
  })

  it.each([
    '',
    'https://gitlab.com/owner/repo',
    'owner',
    'owner/repo name',
  ])('rejects %s', (input) =>
    expect(() => parseRepositoryInput(input)).toThrow(RepositoryInputError))
})
