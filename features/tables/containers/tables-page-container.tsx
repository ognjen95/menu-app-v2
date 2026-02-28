'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import {
  TablesPageHeader,
  LocationSelector,
  TablesGrid,
  CreateTableDialog,
  QrPreviewDialog,
  QrEditDialog,
} from '../components'
import {
  useTables,
  useQrCodes,
  useGenerateQrCode,
  useDeleteTable,
} from '../services/use-tables'
import { useTablesDialogs } from './tables-dialogs'
import { validateTableForm } from '../domains/types'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import type { TablesPageData } from '../services/tables-server'
import type { Location } from '@/lib/types'
import type { Table } from '../domains/types'

interface TablesPageContainerProps {
  initialData: TablesPageData
}

export function TablesPageContainer({ initialData }: TablesPageContainerProps) {
  const t = useTranslations('tablesPage')
  const queryClient = useQueryClient()
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    initialData.initialLocationId
  )
  const [locations] = useState<Location[]>(initialData.locations)

  // Prime React Query cache with SSR data on mount (in format select expects)
  useEffect(() => {
    if (initialData.initialLocationId) {
      queryClient.setQueryData(
        ['tables', initialData.initialLocationId],
        { data: { tables: initialData.tables } }
      )
      queryClient.setQueryData(
        ['qr-codes', initialData.initialLocationId],
        { data: { qr_codes: initialData.qrCodes } }
      )
    }
  }, [queryClient, initialData])

  // Always use React Query - cache is primed with initial data
  const { data: fetchedTables = [], isLoading: tablesLoading } = useTables(selectedLocationId)
  const { data: fetchedQrCodes = [] } = useQrCodes(selectedLocationId)

  // Use fetched data (which starts with cached initial data)
  const tables = fetchedTables
  const qrCodes = fetchedQrCodes

  // Derive existing zones from tables
  const existingZones = useMemo(() => {
    const zones = new Set<string>()
    tables.forEach(table => {
      if (table.zone) zones.add(table.zone)
    })
    return Array.from(zones).sort()
  }, [tables])

  const generateQrCode = useGenerateQrCode(selectedLocationId)
  const deleteTable = useDeleteTable(selectedLocationId)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<Table | null>(null)

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const {
    isCreateOpen,
    setIsCreateOpen,
    formData,
    setFormData,
    handleCreate: submitCreate,
    createTablePending,
    previewQr,
    setPreviewQr,
    qrRef,
    copiedId,
    copyToClipboard,
    downloadQr,
    editQr,
    handleOpenEditQr,
    setEditQr,
    qrStyle,
    setQrStyle,
    handleSaveQrStyle,
    updateQrStylePending,
  } = useTablesDialogs(selectedLocationId)

  // Handle adding table with optional preselected zone
  const handleAddTable = useCallback((zone?: string) => {
    setFormErrors({})
    if (zone) {
      setFormData(prev => ({ ...prev, zone }))
    }
    setIsCreateOpen(true)
  }, [setFormData, setIsCreateOpen])

  // Validate and submit create
  const handleCreateWithValidation = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const result = validateTableForm(
      formData,
      tables,
      { duplicateName: t('duplicateTableName') }
    )
    if (!result.success) {
      setFormErrors(result.errors)
      return
    }
    setFormErrors({})
    submitCreate(e)
  }, [formData, tables, t, submitCreate])

  // Clear errors when form data changes
  const handleFormChange = useCallback((data: typeof formData) => {
    setFormErrors({})
    setFormData(data)
  }, [setFormData])

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm) {
      deleteTable.mutate(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, deleteTable])

  // Download all QR codes as a zip
  const handleExportAllQr = useCallback(async () => {
    if (qrCodes.length === 0) return
    
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    for (const qrCode of qrCodes) {
      const svg = document.getElementById(`qr-${qrCode.id}`)
      if (!svg) continue
      
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = 512
          canvas.height = 512
          ctx?.drawImage(img, 0, 0, 512, 512)
          const dataUrl = canvas.toDataURL('image/png')
          const base64 = dataUrl.split(',')[1]
          zip.file(`qr-${qrCode.code}.png`, base64, { base64: true })
          resolve()
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
      })
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.download = 'qr-codes.zip'
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }, [qrCodes])

  return (
    <div className="space-y-4 md:space-y-6">
      <TablesPageHeader
        title={t('title')}
        description={t('description')}
        exportLabel={t('exportAllQr')}
        addLabel={t('addTable')}
        canAdd={!!selectedLocationId}
        onAdd={() => setIsCreateOpen(true)}
        onExport={handleExportAllQr}
      />

      <LocationSelector
        locations={locations}
        selectedId={selectedLocationId}
        onSelect={setSelectedLocationId}
        emptyMessage={t('noLocations')}
        createLink="/dashboard/settings/locations"
        createLinkLabel={t('createLocationFirst')}
      />

      <TablesGrid
        tables={tables}
        qrCodes={qrCodes}
        isLoading={tablesLoading}
        hasLocation={!!selectedLocationId}
        copiedId={copiedId}
        isGeneratingQr={generateQrCode.isPending}
        deletingTableId={deleteTable.isPending ? (deleteTable.variables as string) : null}
        translations={{
          selectLocation: t('selectLocation'),
          noTables: t('noTables'),
          addFirstTable: t('addFirstTable'),
          addTable: t('addTable'),
          noZone: t('noZone'),
          tables: t('tables'),
          capacity: t('capacity'),
          status: {
            available: t('status.available'),
            occupied: t('status.occupied'),
            reserved: t('status.reserved'),
          },
          generateQr: t('generateQr'),
          copyUrl: t('copyUrl'),
          downloadQr: t('downloadQr'),
          editStyle: t('editStyle'),
          openMenu: t('openMenu'),
          deleteTable: t('deleteTable'),
        }}
        onAddTable={handleAddTable}
        onPreviewQr={setPreviewQr}
        onCopyUrl={copyToClipboard}
        onDownloadQr={downloadQr}
        onEditQr={handleOpenEditQr}
        onGenerateQr={(id: string) => generateQrCode.mutate(id)}
        onDeleteClick={(table: Table) => setDeleteConfirm(table)}
      />

      <CreateTableDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleCreateWithValidation}
        isPending={createTablePending}
        existingZones={existingZones}
        errors={formErrors}
        translations={{
          addTable: t('addTable'),
          addTableDesc: t('addTableDesc'),
          tableNameRequired: t('tableNameRequired'),
          tableNamePlaceholder: t('tableNamePlaceholder'),
          capacity: t('capacity'),
          zone: t('zone'),
          zonePlaceholder: t('zonePlaceholder'),
          newZone: t('newZone'),
          newZonePlaceholder: t('newZonePlaceholder'),
          cancel: t('cancel'),
        }}
      />

      <QrPreviewDialog
        ref={qrRef}
        qrCode={previewQr}
        onClose={() => setPreviewQr(null)}
        onCopy={copyToClipboard}
        onDownload={downloadQr}
        copiedId={copiedId}
        translations={{
          qrCodePreview: t('qrCodePreview'),
          scanToOrder: t('scanToOrder'),
          copyUrl: t('copyUrl'),
          download: t('download'),
          open: t('open'),
        }}
      />

      <QrEditDialog
        qrCode={editQr}
        onClose={() => setEditQr(null)}
        style={qrStyle}
        onStyleChange={setQrStyle}
        onSave={handleSaveQrStyle}
        isPending={updateQrStylePending}
        translations={{
          editQrStyle: t('editQrStyle'),
          editQrStyleDesc: t('editQrStyleDesc'),
          qrColor: t('qrColor'),
          background: t('background'),
          cancel: t('cancel'),
          saveStyle: t('saveStyle'),
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={t('deleteTableTitle')}
        description={t('deleteTableDescription')}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteTable.isPending}
      />
    </div>
  )
}
