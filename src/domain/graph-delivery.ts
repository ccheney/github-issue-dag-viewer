export const AUTOMATIC_LAYOUT_LIMIT = 1_000
export const MAXIMUM_LAYOUT_LIMIT = 5_000
export const PNG_DIMENSION_LIMIT = 6_000

export type GraphDeliveryMode = 'automatic' | 'opt-in' | 'unsupported'

export const graphDeliveryMode = (issueCount: number): GraphDeliveryMode => {
  if (issueCount <= AUTOMATIC_LAYOUT_LIMIT) return 'automatic'
  if (issueCount <= MAXIMUM_LAYOUT_LIMIT) return 'opt-in'
  return 'unsupported'
}

export const canExportPng = (width: number, height: number): boolean =>
  width <= PNG_DIMENSION_LIMIT && height <= PNG_DIMENSION_LIMIT
