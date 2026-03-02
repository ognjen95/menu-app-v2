'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, MapPin } from 'lucide-react'
import { motion, staggerContainer } from '@/components/ui/animated'
import { TablesGridSkeleton } from '@/components/ui/skeletons'
import { TableCard } from './table-card'
import type { Table, QrCode } from '../domains/types'

interface TablesGridProps {
  tables: Table[]
  qrCodes: QrCode[]
  isLoading: boolean
  hasLocation: boolean
  copiedId: string | null
  isGeneratingQr: boolean
  deletingTableId: string | null
  translations: {
    selectLocation: string
    noTables: string
    addFirstTable: string
    addTable: string
    noZone: string
    tables: string
    capacity: string
    status: Record<string, string>
    generateQr: string
    copyUrl: string
    downloadQr: string
    editStyle: string
    openMenu: string
    deleteTable: string
  }
  onAddTable: (zone?: string) => void
  onPreviewQr: (qr: QrCode) => void
  onCopyUrl: (url: string, id: string) => void
  onDownloadQr: (qr: QrCode, tableName: string, zone?: string) => void
  onEditQr: (qr: QrCode) => void
  onGenerateQr: (tableId: string) => void
  onDeleteClick: (table: Table) => void
}

export function TablesGrid({
  tables,
  qrCodes,
  isLoading,
  hasLocation,
  copiedId,
  isGeneratingQr,
  deletingTableId,
  translations: t,
  onAddTable,
  onPreviewQr,
  onCopyUrl,
  onDownloadQr,
  onEditQr,
  onGenerateQr,
  onDeleteClick,
}: TablesGridProps) {
  const tablesByZone = useMemo(() => tables.reduce((acc, table) => {
    const zone = table.zone || t.noZone
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(table)
    return acc
  }, {} as Record<string, Table[]>), [tables, t.noZone])

  const getTableQrCode = (tableId: string) => {
    return qrCodes.find(qr => qr.table_id === tableId)
  }

  if (!hasLocation) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t.selectLocation}</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <TablesGridSkeleton count={8} />
  }

  if (tables.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{t.noTables}</p>
          <Button onClick={() => onAddTable()}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addFirstTable}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(tablesByZone).map(([zone, zoneTables], zoneIndex) => (
        <motion.div
          key={zone}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: zoneIndex * 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>{zone}</span>
            <Badge variant="secondary">{zoneTables.length} {t.tables}</Badge>
          </h2>
          <motion.div
            className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {zoneTables.map((table, tableIndex) => (
              <TableCard
                key={table.id}
                table={table}
                qrCode={getTableQrCode(table.id)}
                index={tableIndex}
                copiedId={copiedId}
                isGenerating={isGeneratingQr}
                isDeleting={deletingTableId === table.id}
                translations={{
                  capacity: t.capacity,
                  status: t.status,
                  generateQr: t.generateQr,
                  copyUrl: t.copyUrl,
                  downloadQr: t.downloadQr,
                  editStyle: t.editStyle,
                  openMenu: t.openMenu,
                  deleteTable: t.deleteTable,
                }}
                onPreviewQr={onPreviewQr}
                onCopyUrl={onCopyUrl}
                onDownloadQr={onDownloadQr}
                onEditQr={onEditQr}
                onGenerateQr={onGenerateQr}
                onDeleteClick={onDeleteClick}
              />
            ))}

            {/* Add table card */}
            <motion.div variants={staggerContainer} custom={zoneTables.length}>
              <Card
                className="border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors h-full hover:opacity-95 transition-all"
                onClick={() => onAddTable(zone === t.noZone ? '' : zone)}
              >
                <CardContent className="py-12 flex flex-col items-center justify-center text-center h-full">
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">{t.addTable}</span>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
