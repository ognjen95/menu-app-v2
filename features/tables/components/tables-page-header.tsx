'use client'

import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'
import { motion } from '@/components/ui/animated'

interface TablesPageHeaderProps {
  title: string
  description: string
  exportLabel: string
  addLabel: string
  canAdd: boolean
  onAdd: () => void
  onExport?: () => void
}

export function TablesPageHeader({
  title,
  description,
  exportLabel,
  addLabel,
  canAdd,
  onAdd,
  onExport,
}: TablesPageHeaderProps) {
  return (
    <motion.div
      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm md:text-base text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" size="sm" className="md:size-default" onClick={onExport}>
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{exportLabel}</span>
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button disabled={!canAdd} onClick={onAdd} size="sm" className="md:size-default">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden sm:inline">{addLabel}</span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
