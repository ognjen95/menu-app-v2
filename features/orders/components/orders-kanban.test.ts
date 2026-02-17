import { describe, it, expect } from '@jest/globals'
import { getKanbanGridTemplate } from './orders-kanban-grid'

describe('getKanbanGridTemplate', () => {
  it('returns at least one column when count is zero', () => {
    expect(getKanbanGridTemplate(0)).toBe('repeat(1, minmax(280px, 1fr))')
  })

  it('uses provided column count when greater than zero', () => {
    expect(getKanbanGridTemplate(3)).toBe('repeat(3, minmax(280px, 1fr))')
  })

  it('handles negative column counts gracefully', () => {
    expect(getKanbanGridTemplate(-5)).toBe('repeat(1, minmax(280px, 1fr))')
  })
})
