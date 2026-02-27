'use client'

import { Button } from '@/components/ui/button'
import { VariantSelector } from '@/components/ui/variant-selector'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Settings2, Plus, ChevronLeft } from 'lucide-react'
import { useVariantSelection } from '@/lib/hooks/use-variant-selection'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import type { VariantSelectionDialogProps } from '../types'

export function VariantSelectionDialog({
  item,
  onClose,
  onAddToCart,
  t,
  tCommon,
}: VariantSelectionDialogProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
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

  // Mobile: Use Sheet (bottom drawer)
  if (isMobile) {
    return (
      <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="p-0 flex flex-col">
          <SheetHeader className="p-4 pb-0 shrink-0">
            <SheetTitle className="flex items-center justify-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              {item.name}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4">
              <VariantSelector
                variantsByCategory={variantsByCategory}
                selectedVariants={selectedVariants}
                onVariantClick={handleVariantClick}
                translations={{
                  selectMultiple: t('selectMultiple'),
                }}
              />
            </div>
          </ScrollArea>
          
          <div className="shrink-0 p-4 pb-8 border-t bg-background space-y-3">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>{t('total')}</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="h-12 px-4" onClick={onClose}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                className="flex-1 h-12 text-lg" 
                onClick={handleAddToCartWithVariants} 
                disabled={!isValid()}
              >
                <Plus className="h-5 w-5 mr-2" />
                {t('addToCart')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md h-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[50vh] overflow-y-auto">
          <VariantSelector
            variantsByCategory={variantsByCategory}
            selectedVariants={selectedVariants}
            onVariantClick={handleVariantClick}
            translations={{
              selectMultiple: t('selectMultiple'),
            }}
          />
        </div>
        <div className="flex items-center justify-between py-4 border-t">
          <span className="text-lg font-bold">€{totalPrice.toFixed(2)}</span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleAddToCartWithVariants} disabled={!isValid()}>
              <Plus className="h-4 w-4 mr-1" />
              {t('addToCart')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
