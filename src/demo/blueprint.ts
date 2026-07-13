import { deliveryTasks } from './blueprint-delivery'
import { foundationTasks } from './blueprint-foundation'
import type { BlueprintTask } from './blueprint-types'

export const blueprintTasks: readonly BlueprintTask[] = [...foundationTasks, ...deliveryTasks]

const taskIds = new Set(blueprintTasks.map(({ id }) => id))

const PLAN_BY_AREA = {
  'area:api': '01-application-architecture-and-github-data.md',
  'area:delivery': '05-quality-deployment-and-roadmap.md',
  'area:docs': '05-quality-deployment-and-roadmap.md',
  'area:foundation': '00-product-scope-and-decisions.md',
  'area:graph': '02-graph-domain-and-analysis.md',
  'area:performance': '05-quality-deployment-and-roadmap.md',
  'area:quality': '05-quality-deployment-and-roadmap.md',
  'area:security': '04-security-and-privacy.md',
  'area:ui': '03-user-interface-and-accessibility.md',
} as const

const ARCHITECTURE_TASKS = new Set(['application-shell', 'pages-architecture'])

for (const task of blueprintTasks) {
  for (const dependency of task.dependencies) {
    if (!taskIds.has(dependency))
      throw new Error(`Unknown dependency ${dependency} for ${task.id}.`)
  }
}

export const blueprintIssueBody = (task: BlueprintTask): string => {
  const box = task.completed ? '[x]' : '[ ]'
  const plan = ARCHITECTURE_TASKS.has(task.id)
    ? '01-application-architecture-and-github-data.md'
    : PLAN_BY_AREA[task.area]
  return `<!-- blueprint-id: ${task.id} -->
## Outcome

${task.outcome}

## Scope

${task.scope.map((item) => `- ${box} ${item}`).join('\n')}

## Acceptance criteria

- ${box} ${task.acceptance}
- ${box} Relevant formatting, linting, type checking, tests, and production builds pass.

## Plan sources

- [${plan}](https://github.com/ccheney/github-issue-dag-viewer/blob/main/docs/plans/${plan})
`
}
