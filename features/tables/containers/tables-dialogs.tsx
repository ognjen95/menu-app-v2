'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { CreateTableDialog, QrPreviewDialog, QrEditDialog } from '../components'
import { useCreateTable, useUpdateQrStyle } from '../services/use-tables'
import type { QrCode, TableFormData, QrStyle } from '../domains/types'
import { DEFAULT_TABLE_FORM, DEFAULT_QR_STYLE } from '../domains/types'

interface TablesDialogsProps {
  locationId: string | null
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
  previewQr: QrCode | null
  setPreviewQr: (qr: QrCode | null) => void
  editQr: QrCode | null
  setEditQr: (qr: QrCode | null) => void
  existingZones?: string[]
}

export function useTablesDialogs(locationId: string | null) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [previewQr, setPreviewQr] = useState<QrCode | null>(null)
  const [editQr, setEditQr] = useState<QrCode | null>(null)
  const [qrStyle, setQrStyle] = useState<QrStyle>(DEFAULT_QR_STYLE)
  const [formData, setFormData] = useState<TableFormData>(DEFAULT_TABLE_FORM)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const createTable = useCreateTable(locationId, () => {
    setIsCreateOpen(false)
    setFormData(DEFAULT_TABLE_FORM)
  })

  const updateQrStyle = useUpdateQrStyle(locationId, () => {
    setEditQr(null)
  })

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const downloadQr = useCallback((qrCode: QrCode, tableName?: string, zone?: string) => {
    const svg = document.getElementById(`qr-${qrCode.id}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = 512
      canvas.height = 512
      ctx?.drawImage(img, 0, 0, 512, 512)
      const link = document.createElement('a')
      // Format: [table name]-[zone].png or [table name].png if no zone
      const filename = zone ? `${tableName}-${zone}.png` : `${tableName || qrCode.code}.png`
      link.download = filename.replace(/\s+/g, '_')
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }, [])

  const handleOpenEditQr = useCallback((qrCode: QrCode) => {
    setEditQr(qrCode)
    setQrStyle({
      color: qrCode.style?.color || DEFAULT_QR_STYLE.color,
      background: qrCode.style?.background || DEFAULT_QR_STYLE.background,
    })
  }, [])

  const handleCreate = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    createTable.mutate(formData)
  }, [createTable, formData])

  const handleSaveQrStyle = useCallback(() => {
    if (editQr) {
      updateQrStyle.mutate({ id: editQr.id, style: qrStyle })
    }
  }, [editQr, qrStyle, updateQrStyle])

  return {
    // Create dialog
    isCreateOpen,
    setIsCreateOpen,
    formData,
    setFormData,
    handleCreate,
    createTablePending: createTable.isPending,
    // Preview dialog
    previewQr,
    setPreviewQr,
    qrRef,
    copiedId,
    copyToClipboard,
    downloadQr,
    // Edit dialog
    editQr,
    setEditQr,
    handleOpenEditQr,
    qrStyle,
    setQrStyle,
    handleSaveQrStyle,
    updateQrStylePending: updateQrStyle.isPending,
  }
}

export function TablesDialogs({
  locationId,
  isCreateOpen,
  setIsCreateOpen,
  previewQr,
  setPreviewQr,
  editQr,
  setEditQr,
  existingZones = [],
}: TablesDialogsProps) {
  const t = useTranslations('tablesPage')
  const {
    formData,
    setFormData,
    handleCreate,
    createTablePending,
    qrRef,
    copiedId,
    copyToClipboard,
    downloadQr,
    qrStyle,
    setQrStyle,
    handleSaveQrStyle,
    updateQrStylePending,
  } = useTablesDialogs(locationId)

  return (
    <>
      <CreateTableDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleCreate}
        isPending={createTablePending}
        existingZones={existingZones}
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
    </>
  )
}
