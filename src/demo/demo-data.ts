import type { RepositorySnapshot } from '../domain/types'
import { type DependencyRef, type IssueLabel, type IssueRecord, issueKey } from '../domain/types'
import { blueprintIssueBody, blueprintTasks } from './blueprint'
import type { BlueprintArea, BlueprintTask } from './blueprint-types'

const REPOSITORY = 'ccheney/github-issue-dag-viewer'
const REPOSITORY_URL = `https://github.com/${REPOSITORY}`

const labelCatalog: Record<BlueprintArea, IssueLabel> = {
  'area:api': { name: 'area:api', color: '0969da', description: 'GitHub API integration' },
  'area:delivery': { name: 'area:delivery', color: 'cf222e', description: 'Delivery and release' },
  'area:docs': { name: 'area:docs', color: '0075ca', description: 'Documentation' },
  'area:foundation': {
    name: 'area:foundation',
    color: '57606a',
    description: 'Architecture and foundation',
  },
  'area:graph': { name: 'area:graph', color: '8250df', description: 'Graph analysis and layout' },
  'area:performance': {
    name: 'area:performance',
    color: 'bc4c00',
    description: 'Performance and scale',
  },
  'area:quality': { name: 'area:quality', color: '1a7f37', description: 'Testing and quality' },
  'area:security': { name: 'area:security', color: 'd1242f', description: 'Security and privacy' },
  'area:ui': { name: 'area:ui', color: 'bf8700', description: 'User interface' },
}

const numberById = new Map(blueprintTasks.map(({ id }, index) => [id, index + 1]))
const taskById = new Map(blueprintTasks.map((task) => [task.id, task]))

const dependency = (id: string): DependencyRef => {
  const task = taskById.get(id)
  const number = numberById.get(id)
  if (task === undefined || number === undefined) throw new Error(`Unknown blueprint task ${id}.`)
  return {
    key: issueKey(REPOSITORY, number),
    number,
    repository: REPOSITORY,
    state: task.completed ? 'CLOSED' : 'OPEN',
    title: task.title,
    url: `${REPOSITORY_URL}/issues/${number}`,
  }
}

const blockingTasks = (id: string): BlueprintTask[] =>
  blueprintTasks.filter(({ dependencies }) => dependencies.includes(id))

const issues: IssueRecord[] = blueprintTasks.map((task, index) => {
  const number = index + 1
  const state = task.completed ? 'CLOSED' : 'OPEN'
  return {
    key: issueKey(REPOSITORY, number),
    id: `blueprint-${task.id}`,
    number,
    repository: REPOSITORY,
    title: task.title,
    url: `${REPOSITORY_URL}/issues/${number}`,
    state,
    stateReason: state === 'CLOSED' ? 'COMPLETED' : null,
    body: blueprintIssueBody(task),
    author: {
      login: 'ccheney',
      avatarUrl: 'https://github.com/ccheney.png',
      url: 'https://github.com/ccheney',
    },
    assignees: [],
    labels: [labelCatalog[task.area]],
    milestone: null,
    createdAt: new Date(Date.UTC(2026, 6, 12, 12, number)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 6, 12, 20, number)).toISOString(),
    closedAt: state === 'CLOSED' ? new Date(Date.UTC(2026, 6, 12, 21, number)).toISOString() : null,
    blockedBy: task.dependencies.map(dependency),
    blocking: blockingTasks(task.id).map(({ id }) => dependency(id)),
    dependencyDataTruncated: false,
    isExternal: false,
  }
})

export const demoSnapshot: RepositorySnapshot = {
  repository: {
    owner: 'ccheney',
    name: 'github-issue-dag-viewer',
    nameWithOwner: REPOSITORY,
    url: REPOSITORY_URL,
  },
  description: 'Interactive GitHub issue dependency DAG and issue explorer',
  isPrivate: false,
  issues,
  fetchedAt: new Date().toISOString(),
  rateLimit: null,
}
