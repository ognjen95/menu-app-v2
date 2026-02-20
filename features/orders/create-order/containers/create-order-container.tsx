'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
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
import { UtensilsCrossed, ChevronLeft } from 'lucide-react'

import { useCreateOrderState } from '../hooks/use-create-order-state'
import { CartSidebar } from '../components/cart-sidebar'
import { VariantSelectionDialog } from '../components/variant-selection-dialog'
import { DesktopMenuContent } from '../components/desktop-menu-content'
import { MobileSetupStep } from '../components/mobile-setup-step'
import { MobileMenuStep } from '../components/mobile-menu-step'
import { Location } from '@/lib/types'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
}

export function CreateOrderContainer({ open, onOpenChange, locations }: CreateOrderDialogProps) {
  const t = useTranslations('createOrder')
  const tCommon = useTranslations('common')

  const state = useCreateOrderState({ open, onOpenChange, t, locations })

  // Shared props for menu content
  const menuContentProps = {
    locations: state.locations,
    selectedLocationId: state.selectedLocationId,
    onLocationChange: state.setSelectedLocationId,
    tables: state.tables,
    selectedTableId: state.selectedTableId,
    onTableChange: state.setSelectedTableId,
    teamMembers: state.teamMembers,
    selectedStaffId: state.selectedStaffId,
    onStaffChange: state.setSelectedStaffId,
    orderType: state.orderType,
    onOrderTypeChange: state.setOrderType,
    searchQuery: state.searchQuery,
    onSearchChange: state.handleSearchChange,
    categories: state.categories,
    selectedCategoryId: state.selectedCategoryId,
    onCategorySelect: state.setSelectedCategoryId,
    isLoadingItems: state.isLoadingItems,
    filteredItems: state.filteredItems,
    itemQuantities: state.itemQuantities,
    recentlyAddedId: state.recentlyAddedId,
    onItemClick: state.handleItemClick,
    cartItemsCount: state.cartItemsCount,
    cartTotal: state.cartTotal,
    onShowCart: () => state.setShowCart(true),
    t,
  }

  // Mobile view with Sheet
  if (state.isMobile) {
    return (
      <>
        <Sheet
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) state.setMobileStep(1)
            onOpenChange(isOpen)
          }}
        >
          <SheetContent
            side="bottom"
            className="max-h-[100dvh] h-[100dvh] p-0 flex flex-col rounded-3xl"
          >
            <SheetHeader className="p-4 border-b shrink-0">
              <SheetTitle className="flex items-center gap-2">
                {state.mobileStep === 1 && (
                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="ghost"
                    className="mr-1 hover:bg-muted -ml-1 h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                {state.mobileStep === 2 && (
                  <Button
                    onClick={() => state.setMobileStep(1)}
                    variant="ghost"
                    className="mr-1 hover:bg-muted -ml-1 h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <UtensilsCrossed className="h-5 w-5" />
                {state.mobileStep === 1 ? t('orderSetup') : t('title')}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {t('step', { current: state.mobileStep, total: 2 })}
              </p>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              {state.mobileStep === 1 ? (
                <MobileSetupStep
                  {...menuContentProps}
                  onContinue={() => state.setMobileStep(2)}
                />
              ) : (
                <MobileMenuStep
                  {...menuContentProps}
                  searchInputRef={state.mobileSearchInputRef}
                  onSearchFocus={() => state.setIsMobileSearchFocused(true)}
                  onSearchBlur={() => state.setIsMobileSearchFocused(false)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Cart sheet for mobile */}
        <Sheet open={state.showCart} onOpenChange={state.setShowCart}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md p-0 max-h-[100dvh] h-[100dvh] flex flex-col"
          >
            <CartSidebar
              cart={state.cart}
              cartTotal={state.cartTotal}
              cartItemsCount={state.cartItemsCount}
              isSubmitting={state.isSubmitting}
              customerInfoControl={state.customerInfoForm.control}
              isCustomerInfoOpen={state.isCustomerInfoOpen}
              onCustomerInfoToggle={state.setIsCustomerInfoOpen}
              onUpdateQuantity={state.updateQuantity}
              onRemoveItem={state.removeFromCart}
              onClearCart={state.clearCart}
              onSubmit={state.handleCreateOrder}
              onClose={() => state.setShowCart(false)}
              t={t}
            />
          </SheetContent>
        </Sheet>

        {/* Variant Selection Dialog */}
        <VariantSelectionDialog
          item={state.itemForVariants}
          onClose={() => state.setItemForVariants(null)}
          onAddToCart={state.addToCartDirect}
          t={t}
          tCommon={tCommon}
        />
      </>
    )
  }

  // Desktop view with Dialog
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="full">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              {t('title')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Menu section */}
            <div className="flex-1 border-r min-w-0">
              <DesktopMenuContent {...menuContentProps} isMobile={state.isMobile} />
            </div>

            {/* Cart sidebar */}
            <div className="w-96 xl:w-[420px] shrink-0">
              <CartSidebar
                cart={state.cart}
                cartTotal={state.cartTotal}
                cartItemsCount={state.cartItemsCount}
                isSubmitting={state.isSubmitting}
                customerInfoControl={state.customerInfoForm.control}
                isCustomerInfoOpen={state.isCustomerInfoOpen}
                onCustomerInfoToggle={state.setIsCustomerInfoOpen}
                onUpdateQuantity={state.updateQuantity}
                onRemoveItem={state.removeFromCart}
                onClearCart={state.clearCart}
                onSubmit={state.handleCreateOrder}
                t={t}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Selection Dialog */}
      <VariantSelectionDialog
        item={state.itemForVariants}
        onClose={() => state.setItemForVariants(null)}
        onAddToCart={state.addToCartDirect}
        t={t}
        tCommon={tCommon}
      />
    </>
  )
}
