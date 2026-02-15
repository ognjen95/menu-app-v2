'use client'

import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Copy, Download, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { QrCode } from '../domains/types'

interface QrPreviewDialogProps {
  qrCode: QrCode | null
  onClose: () => void
  onCopy: (url: string, id: string) => void
  onDownload: (qrCode: QrCode) => void
  copiedId: string | null
  translations: {
    qrCodePreview: string
    scanToOrder: string
    copyUrl: string
    download: string
    open: string
  }
}

export const QrPreviewDialog = forwardRef<HTMLDivElement, QrPreviewDialogProps>(
  ({ qrCode, onClose, onCopy, onDownload, copiedId, translations: t }, ref) => {
    return (
      <Dialog open={!!qrCode} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.qrCodePreview}</DialogTitle>
            <DialogDescription>{t.scanToOrder}</DialogDescription>
          </DialogHeader>
          {qrCode && (
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-white rounded-lg" ref={ref}>
                <QRCodeSVG
                  id={`qr-preview-${qrCode.id}`}
                  value={qrCode.url}
                  size={256}
                  fgColor={qrCode.style?.color || '#000000'}
                  bgColor={qrCode.style?.background || '#ffffff'}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-mono text-muted-foreground">{qrCode.code}</p>
                <p className="text-xs text-muted-foreground break-all">{qrCode.url}</p>
              </div>
              <DialogFooter className="flex-row gap-2 sm:justify-center">
                <Button variant="outline" onClick={() => onCopy(qrCode.url, qrCode.id)}>
                  {copiedId === qrCode.id ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {t.copyUrl}
                </Button>
                <Button onClick={() => onDownload(qrCode)}>
                  <Download className="h-4 w-4 mr-2" />
                  {t.download}
                </Button>
                <Button variant="outline" onClick={() => window.open(qrCode.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t.open}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }
)

QrPreviewDialog.displayName = 'QrPreviewDialog'
