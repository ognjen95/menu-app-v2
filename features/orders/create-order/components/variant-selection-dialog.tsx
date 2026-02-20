'use client'

import { Button } from '@/components/ui/button'
import { VariantSelector } from '@/components/ui/variant-selector'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Settings2, Plus } from 'lucide-react'
import { useVariantSelection } from '@/lib/hooks/use-variant-selection'
import type { VariantSelectionDialogProps } from '../types'

export function VariantSelectionDialog({
  item,
  onClose,
  onAddToCart,
  t,
  tCommon,
}: VariantSelectionDialogProps) {
  const {
    selectedVariants,
    variantsByCategory,
    handleVariantClick,
    totalPrice,
    getSelectedVariantInfos,
    isValid,
  } = useVariantSelection({
    variants: item?.menu_item_variants,
    basePrice: item?.base_price || 0,
    itemId: item?.id,
  })

  const handleAddToCartWithVariants = () => {
    if (!item) return
    const variantInfos = getSelectedVariantInfos()
    onAddToCart(item, variantInfos, totalPrice)
    onClose()
  }

  if (!item) return null

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md h-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
          <VariantSelector
            variantsByCategory={variantsByCategory}
            selectedVariants={selectedVariants}
            onVariantClick={handleVariantClick}
            translations={{
              selectMultiple: t('selectMultiple'),
            }}
          />
        </div>
        <div className="text-right text-lg font-bold shrink-0">€{totalPrice.toFixed(2)}</div>
        <DialogFooter className="flex-row items-center justify-end gap-3 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleAddToCartWithVariants} disabled={!isValid()}>
            <Plus className="h-4 w-4 mr-1" />
            {t('addToCart')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
