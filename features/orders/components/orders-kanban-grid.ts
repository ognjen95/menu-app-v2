export const MIN_KANBAN_COLUMN_WIDTH = 280

export const getKanbanGridTemplate = (columnCount: number) => {
  const count = Math.max(columnCount, 1)
  return `repeat(${count}, minmax(${MIN_KANBAN_COLUMN_WIDTH}px, 1fr))`
}
