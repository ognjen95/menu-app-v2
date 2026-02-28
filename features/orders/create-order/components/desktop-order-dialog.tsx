'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UtensilsCrossed } from 'lucide-react'
import { CartSidebar } from './cart-sidebar'
import { VariantSelectionDialog } from './variant-selection-dialog'
import { DesktopMenuContent } from './desktop-menu-content'
import type { MenuItemWithVariants, CartItem, OrderType, TeamMember } from '../types'
import type { Control } from 'react-hook-form'
import { Location, Table } from '@/lib/types'

type MenuContentProps = {
  locations: Location[]
  selectedLocationId: string
  onLocationChange: (id: string) => void
  tables: Table[]
  selectedTableId: string
  onTableChange: (id: string) => void
  teamMembers: TeamMember[]
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

interface DesktopOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuContentProps: MenuContentProps
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

export function DesktopOrderDialog({
  open,
  onOpenChange,
  menuContentProps,
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
}: DesktopOrderDialogProps) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="full">
          <DialogHeader className="p-4 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              {t('title')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Menu section */}
            <div className="flex-1 min-w-0">
              <DesktopMenuContent {...menuContentProps} isMobile={false} />
            </div>

            {/* Cart sidebar */}
            <div className="w-96 xl:w-[420px] shrink-0">
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
                t={t}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Selection Dialog */}
      <VariantSelectionDialog
        item={itemForVariants}
        onClose={() => setItemForVariants(null)}
        onAddToCart={addToCartDirect}
        t={t}
        tCommon={tCommon}
      />
    </>
  )
}
