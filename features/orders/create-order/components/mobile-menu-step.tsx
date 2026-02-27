import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, ShoppingCart, MapPin, UtensilsCrossed, ChevronLeft } from 'lucide-react'

import { MenuItemsGrid } from './menu-items-grid'
import { CategoryFilter } from './category-filter'
import type { MobileMenuStepProps } from '../types'

export function MobileMenuStep({
  locations,
  selectedLocationId,
  tables,
  selectedTableId,
  orderType,
  searchQuery,
  onSearchChange,
  searchInputRef,
  onSearchFocus,
  onSearchBlur,
  categories,
  selectedCategoryId,
  onCategorySelect,
  isLoadingItems,
  filteredItems,
  itemQuantities,
  recentlyAddedId,
  onItemClick,
  onQuantityChange,
  onRemoveOne,
  cartItemsCount,
  cartTotal,
  onShowCart,
  onBack,
  t,
}: MobileMenuStepProps) {
  const selectedLocation = locations.find(l => l.id === selectedLocationId)
  const selectedTable = tables.find(t => t.id === selectedTableId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search and filters */}
      <div className="p-4 border-b space-y-3 shrink-0">
        {/* Order info badge */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {selectedLocation?.name}
          </span>
          {orderType === 'dine_in' && selectedTableId && (
            <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
              <UtensilsCrossed className="h-3 w-3" />
              {selectedTable?.name}
            </span>
          )}
          <span className="px-2 py-1 bg-muted rounded-md">
            {orderType === 'dine_in'
              ? t('dineIn')
              : orderType === 'takeaway'
              ? t('takeaway')
              : t('delivery')}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchItems')}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            ref={searchInputRef}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            className="pl-10 h-10"
          />
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          isLoading={isLoadingItems}
          onCategorySelect={onCategorySelect}
          t={t}
        />
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          <MenuItemsGrid
            items={filteredItems}
            itemQuantities={itemQuantities}
            recentlyAddedId={recentlyAddedId}
            isLoading={isLoadingItems}
            onItemClick={onItemClick}
            onQuantityChange={onQuantityChange}
            onRemoveOne={onRemoveOne}
            t={t}
          />
        </div>
      </ScrollArea>

      {/* Footer buttons */}
      <div className="shrink-0 p-4 pb-8 border-t bg-background flex gap-3">
        <Button
          variant="secondary"
          className="h-12 px-4"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

          <Button
            className="flex-1 h-12"
            onClick={onShowCart}
            disabled={!cartItemsCount}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {t('viewCart')} ({cartItemsCount}) - €{cartTotal.toFixed(2)}
          </Button>
      </div>
    </div>
  )
}
