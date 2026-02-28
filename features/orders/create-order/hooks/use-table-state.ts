'use client'

import { useState, useCallback } from 'react'
import type { Table } from '@/lib/types'

type UseTableStateProps = {
  tables: Table[]
}

export function useTableState({ tables }: UseTableStateProps) {
  const [selectedTableId, setSelectedTableId] = useState<string>('')

  const handleTableChange = useCallback((tableId: string) => {
    setSelectedTableId(tableId)
  }, [])

  const resetTable = useCallback(() => {
    setSelectedTableId('')
  }, [])

  const selectedTable = tables.find(t => t.id === selectedTableId)

  return {
    tables,
    selectedTableId,
    selectedTable,
    setSelectedTableId: handleTableChange,
    resetTable,
  }
}
