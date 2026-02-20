'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Trash2,
  Users,
  Copy,
  ExternalLink,
  Loader2,
  Check,
  QrCode as QrCodeIcon,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { motion, staggerItemScale } from '@/components/ui/animated'
import type { Table, QrCode } from '../domains/types'

interface TableCardProps {
  table: Table
  qrCode?: QrCode | null
  index: number
  copiedId: string | null
  isGenerating: boolean
  translations: {
    capacity: string
    status: Record<string, string>
    generateQr: string
    copyUrl: string
    downloadQr: string
    editStyle: string
    openMenu: string
    deleteTable: string
  }
  onPreviewQr: (qr: QrCode) => void
  onCopyUrl: (url: string, id: string) => void
  onDownloadQr: (qr: QrCode) => void
  onEditQr: (qr: QrCode) => void
  onGenerateQr: (tableId: string) => void
  onDelete: (tableId: string) => void
}

export function TableCard({
  table,
  qrCode,
  index,
  copiedId,
  isGenerating,
  translations: t,
  onPreviewQr,
  onCopyUrl,
  onDownloadQr,
  onEditQr,
  onGenerateQr,
  onDelete,
}: TableCardProps) {
  return (
    <motion.div variants={staggerItemScale} custom={index}>
      <Card
        className={cn(
          'relative overflow-hidden transition-all hover:shadow-lg',
          table.status === 'occupied' && 'border-yellow-500',
          table.status === 'reserved' && 'border-blue-500',
        )}
      >
        {/* Status indicator */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1',
          table.status === 'available' && 'bg-green-500',
          table.status === 'occupied' && 'bg-yellow-500',
          table.status === 'reserved' && 'bg-blue-500',
        )} />

        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base md:text-lg truncate">{table.name}</CardTitle>
            <Badge
              variant={
                table.status === 'available' ? 'default' :
                  table.status === 'occupied' ? 'secondary' : 'outline'
              }
              className="text-xs shrink-0"
            >
              {t.status[table.status] || table.status}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            <Users className="h-3 w-3 inline mr-1" />
            {t.capacity}: {table.capacity}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* QR Code preview */}
          {qrCode ? (
            <div
              className="aspect-square bg-white rounded-lg flex items-center justify-center p-3 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => onPreviewQr(qrCode)}
            >
              <QRCodeSVG
                id={`qr-${qrCode.id}`}
                value={qrCode.url}
                size={120}
                fgColor={qrCode.style?.color || '#000000'}
                bgColor={qrCode.style?.background || '#ffffff'}
                level="M"
              />
            </div>
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateQr(table.id)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                )}
                {t.generateQr}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-1">
            {qrCode && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onCopyUrl(qrCode.url, qrCode.id)}
                  title={t.copyUrl}
                >
                  {copiedId === qrCode.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onDownloadQr(qrCode)}
                  title={t.downloadQr}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onEditQr(qrCode)}
                  title={t.editStyle}
                >
                  <Palette className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => window.open(qrCode.url, '_blank')}
                  title={t.openMenu}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <div className="flex-1" />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => { if (confirm(t.deleteTable)) onDelete(table.id) }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
