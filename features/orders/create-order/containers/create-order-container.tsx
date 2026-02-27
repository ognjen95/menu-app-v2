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
import { Location, MenuItem, Table } from '@/lib/types'
import { MenuItemWithVariants, TeamMember } from '../types'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  tables: Table[]
  team: TeamMember[]
  menuItems: MenuItemWithVariants[]
}

export function CreateOrderContainer({ open, onOpenChange, locations, tables, team, menuItems }: CreateOrderDialogProps) {
  const t = useTranslations('createOrder')
  const tCommon = useTranslations('common')

  const state = useCreateOrderState({ open, onOpenChange, t, locations, tables, team, menuItems })

  // Shared props for menu content
  const menuContentProps = {
    locations: state.locations,
    selectedLocationId: state.selectedLocationId,
    onLocationChange: state.setSelectedLocationId,
    tables: state.tables,
    selectedTableId: state.selectedTableId,
    onTableChange: state.setSelectedTableId,
    teamMembers: state.team,
    selectedStaffId: state.selectedStaffId,
    onStaffChange: state.setSelectedStaffId,
    orderType: state.orderType,
    onOrderTypeChange: state.setOrderType,
    searchQuery: state.searchQuery,
    onSearchChange: state.handleSearchChange,
    categories: state.categories,
    selectedCategoryId: state.selectedCategoryId,
    onCategorySelect: state.setSelectedCategoryId,
    isLoadingItems: false,
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
            fullHeight
            className="p-0 flex flex-col"
          >
            <SheetHeader className="px-4 pt-2 pb-3 shrink-0">
              <SheetTitle className="flex items-center justify-center gap-2 text-base">
                <UtensilsCrossed className="h-4 w-4" />
                {state.mobileStep === 1 ? t('orderSetup') : t('title')}
              </SheetTitle>
              {/* Progress line */}
              <div className="flex gap-1 mt-1.5">
                <div className="h-1 flex-1 rounded-full bg-primary" />
                <div className={`h-1 flex-1 rounded-full transition-colors ${state.mobileStep === 2 ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              {state.mobileStep === 1 ? (
                <MobileSetupStep
                  {...menuContentProps}
                  onContinue={() => state.setMobileStep(2)}
                  onBack={() => onOpenChange(false)}
                />
              ) : (
                <MobileMenuStep
                  {...menuContentProps}
                  searchInputRef={state.mobileSearchInputRef}
                  onSearchFocus={() => state.setIsMobileSearchFocused(true)}
                  onSearchBlur={() => state.setIsMobileSearchFocused(false)}
                  onBack={() => state.setMobileStep(1)}
                />
              )}
            </div>
            
            {/* Variant Selection Dialog - nested inside parent sheet */}
            <VariantSelectionDialog
              item={state.itemForVariants}
              onClose={() => state.setItemForVariants(null)}
              onAddToCart={state.addToCartDirect}
              t={t}
              tCommon={tCommon}
            />
          </SheetContent>
        </Sheet>

        {/* Cart sheet for mobile */}
        <Sheet open={state.showCart} onOpenChange={state.setShowCart}>
          <SheetContent
            side="bottom"
            fullHeight
            className="p-0 flex flex-col"
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
