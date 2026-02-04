'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  warningMessage?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  isLoading?: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  warningMessage,
  confirmText,
  cancelText,
  onConfirm,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  const t = useTranslations('common')
  
  const displayTitle = title || t('areYouSure')
  const displayDescription = description || t('cannotBeUndone')
  const displayConfirmText = confirmText || t('delete')
  const displayCancelText = cancelText || t('cancel')
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{displayTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {displayDescription}
            {warningMessage && (
              <span className="block mt-2 text-amber-500 font-medium">
                ⚠️ {warningMessage}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            disabled={isLoading}
          >
            {displayCancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('deleting')}
              </>
            ) : (
              displayConfirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
