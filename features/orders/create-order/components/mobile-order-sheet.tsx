'use client'

import { RefObject } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { UtensilsCrossed } from 'lucide-react'
import { CartSidebar } from './cart-sidebar'
import { VariantSelectionDialog } from './variant-selection-dialog'
import { MobileSetupStep } from './mobile-setup-step'
import { MobileMenuStep } from './mobile-menu-step'
import type { MenuItemWithVariants, CartItem, OrderType } from '../types'
import type { Control } from 'react-hook-form'

type MenuContentProps = {
  locations: any[]
  selectedLocationId: string
  onLocationChange: (id: string) => void
  tables: any[]
  selectedTableId: string
  onTableChange: (id: string) => void
  teamMembers: any[]
  selectedUserId: string
  onUserChange: (id: string) => void
  orderType: OrderType
  onOrderTypeChange: (type: OrderType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  categories: any[]
  selectedCategoryId: string | null
  onCategorySelect: (id: string | null) => void
  isLoadingItems: boolean
  filteredItems: MenuItemWithVariants[]
  itemQuantities: Record<string, number>
  recentlyAddedId: string | null
  onItemClick: (item: MenuItemWithVariants) => void
  onQuantityChange: (itemId: string, delta: number) => void
  onRemoveOne: (itemId: string) => void
  cartItemsCount: number
  cartTotal: number
  onShowCart: () => void
  t: (key: string) => string
}

interface MobileOrderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuContentProps: MenuContentProps
  mobileStep: 1 | 2
  setMobileStep: (step: 1 | 2) => void
  mobileSearchInputRef: RefObject<HTMLInputElement>
  setIsMobileSearchFocused: (focused: boolean) => void
  showCart: boolean
  setShowCart: (show: boolean) => void
  isCustomerInfoOpen: boolean
  setIsCustomerInfoOpen: (open: boolean) => void
  cart: CartItem[]
  cartTotal: number
  cartItemsCount: number
  isSubmitting: boolean
  customerInfoControl: Control<any>
  updateQuantity: (cartItemId: string, delta: number) => void
  removeFromCart: (cartItemId: string) => void
  clearCart: () => void
  handleCreateOrder: () => void
  itemForVariants: MenuItemWithVariants | null
  setItemForVariants: (item: MenuItemWithVariants | null) => void
  addToCartDirect: (item: MenuItemWithVariants, variants: any[], price: number) => void
  t: (key: string) => string
  tCommon: (key: string) => string
}

export function MobileOrderSheet({
  open,
  onOpenChange,
  menuContentProps,
  mobileStep,
  setMobileStep,
  mobileSearchInputRef,
  setIsMobileSearchFocused,
  showCart,
  setShowCart,
  isCustomerInfoOpen,
  setIsCustomerInfoOpen,
  cart,
  cartTotal,
  cartItemsCount,
  isSubmitting,
  customerInfoControl,
  updateQuantity,
  removeFromCart,
  clearCart,
  handleCreateOrder,
  itemForVariants,
  setItemForVariants,
  addToCartDirect,
  t,
  tCommon,
}: MobileOrderSheetProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setMobileStep(1)
    onOpenChange(isOpen)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          fullHeight
          className="p-0 flex flex-col"
        >
          <SheetHeader className="px-4 pt-2 pb-3 shrink-0">
            <SheetTitle className="flex items-center justify-center gap-2 text-base">
              <UtensilsCrossed className="h-4 w-4" />
              {mobileStep === 1 ? t('orderSetup') : t('title')}
            </SheetTitle>
            {/* Progress line */}
            <div className="flex gap-1 mt-1.5">
              <div className="h-1 flex-1 rounded-full bg-primary" />
              <div className={`h-1 flex-1 rounded-full transition-colors ${mobileStep === 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            {mobileStep === 1 ? (
              <MobileSetupStep
                {...menuContentProps}
                onContinue={() => setMobileStep(2)}
                onBack={() => onOpenChange(false)}
              />
            ) : (
              <MobileMenuStep
                {...menuContentProps}
                searchInputRef={mobileSearchInputRef}
                onSearchFocus={() => setIsMobileSearchFocused(true)}
                onSearchBlur={() => setIsMobileSearchFocused(false)}
                onBack={() => setMobileStep(1)}
              />
            )}
          </div>

          {/* Variant Selection Dialog - nested inside parent sheet */}
          <VariantSelectionDialog
            item={itemForVariants}
            onClose={() => setItemForVariants(null)}
            onAddToCart={addToCartDirect}
            t={t}
            tCommon={tCommon}
          />
        </SheetContent>
      </Sheet>

      {/* Cart sheet for mobile */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent
          side="bottom"
          fullHeight
          className="p-0 flex flex-col"
        >
          <CartSidebar
            cart={cart}
            cartTotal={cartTotal}
            cartItemsCount={cartItemsCount}
            isSubmitting={isSubmitting}
            customerInfoControl={customerInfoControl}
            isCustomerInfoOpen={isCustomerInfoOpen}
            onCustomerInfoToggle={setIsCustomerInfoOpen}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onSubmit={handleCreateOrder}
            onClose={() => setShowCart(false)}
            t={t}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
