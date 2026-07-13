import type { RepositoryRef } from '../domain/types'

const GITHUB_HOST = 'github.com'
const NAME_PATTERN = /^[a-z\d](?:[a-z\d._-]{0,98}[a-z\d])?$/i

export class RepositoryInputError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'RepositoryInputError'
  }
}

const parsePath = (pathname: string): [string, string] => {
  const segments = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  const owner = segments[0]
  const rawName = segments[1]

  if (owner === undefined || rawName === undefined) {
    throw new RepositoryInputError('Enter a repository as owner/name or a GitHub URL.')
  }

  const name = rawName.replace(/\.git$/i, '')
  if (!NAME_PATTERN.test(owner) || !NAME_PATTERN.test(name)) {
    throw new RepositoryInputError('The repository owner or name contains unsupported characters.')
  }

  return [owner, name]
}

export const parseRepositoryInput = (input: string): RepositoryRef => {
  const value = input.trim()
  if (value.length === 0) {
    throw new RepositoryInputError('Enter a GitHub repository URL.')
  }

  let path = value
  if (value.startsWith('git@github.com:')) {
    path = value.slice('git@github.com:'.length)
  } else if (/^https?:\/\//i.test(value)) {
    const url = new URL(value)
    if (url.hostname.toLowerCase() !== GITHUB_HOST) {
      throw new RepositoryInputError('Only github.com repository URLs are supported.')
    }
    path = url.pathname
  }

  const [owner, name] = parsePath(path)
  return {
    owner,
    name,
    nameWithOwner: `${owner}/${name}`,
    url: `https://github.com/${owner}/${name}`,
  }
}
