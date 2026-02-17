'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { QrCode, QrStyle } from '../domains/types'

interface QrEditDialogProps {
  qrCode: QrCode | null
  onClose: () => void
  style: QrStyle
  onStyleChange: (style: QrStyle) => void
  onSave: () => void
  isPending: boolean
  translations: {
    editQrStyle: string
    editQrStyleDesc: string
    qrColor: string
    background: string
    cancel: string
    saveStyle: string
  }
}

export function QrEditDialog({
  qrCode,
  onClose,
  style,
  onStyleChange,
  onSave,
  isPending,
  translations: t,
}: QrEditDialogProps) {
  return (
    <Dialog open={!!qrCode} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.editQrStyle}</DialogTitle>
          <DialogDescription>{t.editQrStyleDesc}</DialogDescription>
        </DialogHeader>
        {qrCode && (
          <div className="space-y-6">
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCodeSVG
                value={qrCode.url}
                size={200}
                fgColor={style.color}
                bgColor={style.background}
                level="M"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-color">{t.qrColor}</Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-color"
                    type="color"
                    value={style.color}
                    onChange={(e) => onStyleChange({ ...style, color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={style.color}
                    onChange={(e) => onStyleChange({ ...style, color: e.target.value })}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-bg">{t.background}</Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-bg"
                    type="color"
                    value={style.background}
                    onChange={(e) => onStyleChange({ ...style, background: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={style.background}
                    onChange={(e) => onStyleChange({ ...style, background: e.target.value })}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
              <Button onClick={onSave} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t.saveStyle}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
