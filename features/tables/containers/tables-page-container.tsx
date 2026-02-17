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
import type { TablesPageData } from '../services/tables-server'
import type { Location } from '@/lib/types'

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

  return (
    <div className="space-y-4 md:space-y-6">
      <TablesPageHeader
        title={t('title')}
        description={t('description')}
        exportLabel={t('exportAllQr')}
        addLabel={t('addTable')}
        canAdd={!!selectedLocationId}
        onAdd={() => setIsCreateOpen(true)}
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
        onDeleteTable={(id: string) => deleteTable.mutate(id)}
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
    </div>
  )
}
