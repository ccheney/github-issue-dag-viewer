import { describe, expect, it } from 'vitest'
import {
  AUTOMATIC_LAYOUT_LIMIT,
  canExportPng,
  graphDeliveryMode,
  MAXIMUM_LAYOUT_LIMIT,
  PNG_DIMENSION_LIMIT,
} from '../src/domain/graph-delivery'

describe('graph delivery policy', () => {
  it('requires consent for measured large graphs and rejects unsupported sizes', () => {
    expect(graphDeliveryMode(AUTOMATIC_LAYOUT_LIMIT)).toBe('automatic')
    expect(graphDeliveryMode(AUTOMATIC_LAYOUT_LIMIT + 1)).toBe('opt-in')
    expect(graphDeliveryMode(MAXIMUM_LAYOUT_LIMIT)).toBe('opt-in')
    expect(graphDeliveryMode(MAXIMUM_LAYOUT_LIMIT + 1)).toBe('unsupported')
  })

  it('only permits PNG exports within both measured dimensions', () => {
    expect(canExportPng(PNG_DIMENSION_LIMIT, PNG_DIMENSION_LIMIT)).toBe(true)
    expect(canExportPng(PNG_DIMENSION_LIMIT + 1, 100)).toBe(false)
    expect(canExportPng(100, PNG_DIMENSION_LIMIT + 1)).toBe(false)
  })
})
