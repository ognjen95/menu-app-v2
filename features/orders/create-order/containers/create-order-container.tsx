'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Search,
  ShoppingCart,
  UtensilsCrossed,
  ChevronRight,
  ChevronLeft,
  MapPin,
  User,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useCreateOrderState } from '../hooks/use-create-order-state'
import { MenuItemsGrid } from '../components/menu-items-grid'
import { CartSidebar } from '../components/cart-sidebar'
import { OrderTypeSelector, OrderTypeSelectorMobile } from '../components/order-type-selector'
import { CategoryFilter } from '../components/category-filter'
import { VariantSelectionDialog } from '../components/variant-selection-dialog'
import { LocationSelect, TableSelect, StaffSelect } from '../components/order-setup-selects'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrderContainer({ open, onOpenChange }: CreateOrderDialogProps) {
  const t = useTranslations('createOrder')
  const tCommon = useTranslations('common')

  const state = useCreateOrderState({ open, onOpenChange, t })

  // Desktop Main Content
  const renderDesktopMainContent = () => (
    <div className="flex flex-col h-full">
      {/* Top bar - Location, Table, Staff, Order Type */}
      <div className="p-4 border-b space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <LocationSelect
            locations={state.locations}
            selectedLocationId={state.selectedLocationId}
            onLocationChange={state.setSelectedLocationId}
            t={t}
          />
          <TableSelect
            tables={state.tables}
            selectedTableId={state.selectedTableId}
            orderType={state.orderType}
            onTableChange={state.setSelectedTableId}
            t={t}
          />
          <StaffSelect
            teamMembers={state.teamMembers}
            selectedStaffId={state.selectedStaffId}
            onStaffChange={state.setSelectedStaffId}
            t={t}
          />
        </div>

        <OrderTypeSelector
          orderType={state.orderType}
          onOrderTypeChange={state.setOrderType}
          t={t}
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchItems')}
            value={state.searchQuery}
            onChange={e => state.handleSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <CategoryFilter
          categories={state.categories}
          selectedCategoryId={state.selectedCategoryId}
          isLoading={state.isLoadingItems}
          onCategorySelect={state.setSelectedCategoryId}
          t={t}
        />
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1 p-4">
        <MenuItemsGrid
          items={state.filteredItems}
          itemQuantities={state.itemQuantities}
          recentlyAddedId={state.recentlyAddedId}
          isLoading={state.isLoadingItems}
          onItemClick={state.handleItemClick}
          t={t}
        />
      </ScrollArea>

      {/* Mobile cart button */}
      {state.isMobile && state.cartItemsCount > 0 && (
        <div className="p-4 pb-8 border-t safe-area-pb">
          <Button
            className="w-full h-12"
            onClick={() => state.setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {t('viewCart')} ({state.cartItemsCount}) - €{state.cartTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )

  // Mobile Setup Step (Step 1)
  const renderMobileSetupStep = () => {
    const selectedLocation = state.locations.find(l => l.id === state.selectedLocationId)
    const selectedStaff = state.teamMembers.find(m => m.user_id === state.selectedStaffId)

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            <Accordion type="multiple" className="space-y-2">
              {/* Location Accordion */}
              <AccordionItem value="location" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-left">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('selectLocation')}</span>
                      <span className="font-medium">
                        {selectedLocation?.name || t('selectLocation')}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {state.locations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => state.setSelectedLocationId(loc.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-left transition-all",
                          state.selectedLocationId === loc.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium">{loc.name}</span>
                        {state.selectedLocationId === loc.id && (
                          <Check className="h-4 w-4 text-primary float-right" />
                        )}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Staff Accordion */}
              <AccordionItem value="staff" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-left">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('selectStaff')}</span>
                      <div className="flex items-center gap-2">
                        {selectedStaff && (
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={selectedStaff.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(selectedStaff.profiles?.full_name || selectedStaff.role).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="font-medium">
                          {selectedStaff?.profiles?.full_name || selectedStaff?.role || t('selectStaff')}
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {state.teamMembers.map(member => (
                      <button
                        key={member.user_id}
                        onClick={() => state.setSelectedStaffId(member.user_id)}
                        className={cn(
                          "p-3 rounded-lg border-2 flex items-center gap-2 transition-all",
                          state.selectedStaffId === member.user_id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(member.profiles?.full_name || member.role).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate flex-1">
                          {member.profiles?.full_name || member.role}
                        </span>
                        {state.selectedStaffId === member.user_id && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Order Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('orderType')}
              </label>
              <OrderTypeSelectorMobile
                orderType={state.orderType}
                onOrderTypeChange={state.setOrderType}
                t={t}
              />
            </div>

            {/* Table Selection (only for dine_in) */}
            {state.orderType === 'dine_in' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  {t('selectTableTitle')}
                </label>
                {state.tables.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {state.tables.map(table => (
                      <button
                        key={table.id}
                        onClick={() => state.setSelectedTableId(table.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center transition-all",
                          state.selectedTableId === table.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium text-sm">{table.name}</span>
                        {table.zone && (
                          <span className="block text-xs opacity-70">{table.zone}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('noTablesAvailable')}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Continue button */}
        <div className="shrink-0 p-4 bg-background border-t">
          <Button
            className="w-full h-12 text-lg"
            onClick={() => state.setMobileStep(2)}
            disabled={
              !state.selectedLocationId ||
              !state.selectedStaffId ||
              (state.orderType === 'dine_in' && !state.selectedTableId)
            }
          >
            {t('continue')}
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Mobile Menu Step (Step 2)
  const renderMobileMenuStep = () => (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 border-b space-y-3">
        {/* Order info badge */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {state.locations.find(l => l.id === state.selectedLocationId)?.name}
          </span>
          {state.orderType === 'dine_in' && state.selectedTableId && (
            <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
              <UtensilsCrossed className="h-3 w-3" />
              {state.tables.find(t => t.id === state.selectedTableId)?.name}
            </span>
          )}
          <span className="px-2 py-1 bg-muted rounded-md">
            {state.orderType === 'dine_in'
              ? t('dineIn')
              : state.orderType === 'takeaway'
              ? t('takeaway')
              : t('delivery')}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchItems')}
            value={state.searchQuery}
            onChange={e => state.handleSearchChange(e.target.value)}
            ref={state.mobileSearchInputRef}
            onFocus={() => state.setIsMobileSearchFocused(true)}
            onBlur={() => state.setIsMobileSearchFocused(false)}
            className="pl-10 h-10"
          />
        </div>

        <CategoryFilter
          categories={state.categories}
          selectedCategoryId={state.selectedCategoryId}
          isLoading={state.isLoadingItems}
          onCategorySelect={state.setSelectedCategoryId}
          t={t}
        />
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1 p-4">
        <MenuItemsGrid
          items={state.filteredItems}
          itemQuantities={state.itemQuantities}
          recentlyAddedId={state.recentlyAddedId}
          isLoading={state.isLoadingItems}
          onItemClick={state.handleItemClick}
          t={t}
        />
      </ScrollArea>

      {/* Mobile cart button */}
      {state.cartItemsCount > 0 && (
        <div className="p-4 border-t safe-area-pb">
          <Button
            className="w-full h-12"
            onClick={() => state.setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {t('viewCart')} ({state.cartItemsCount}) - €{state.cartTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )

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
              {state.mobileStep === 1 ? renderMobileSetupStep() : renderMobileMenuStep()}
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
        <DialogContent className="min-w-[90vw] max-h-[100vh] min-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              {t('title')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Menu section */}
            <div className="flex-1 border-r">
              {renderDesktopMainContent()}
            </div>

            {/* Cart sidebar */}
            <div className="w-80 lg:w-96">
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
