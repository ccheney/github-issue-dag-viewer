export type BlueprintArea =
  | 'area:api'
  | 'area:delivery'
  | 'area:docs'
  | 'area:foundation'
  | 'area:graph'
  | 'area:performance'
  | 'area:quality'
  | 'area:security'
  | 'area:ui'

export interface BlueprintTask {
  id: string
  title: string
  area: BlueprintArea
  dependencies: readonly string[]
  completed: boolean
  outcome: string
  scope: readonly [string, string]
  acceptance: string
}
