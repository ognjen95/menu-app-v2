import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, ShoppingCart } from 'lucide-react'

import { MenuItemsGrid } from './menu-items-grid'
import { OrderTypeSelector } from './order-type-selector'
import { CategoryFilter } from './category-filter'
import { LocationSelect, TableSelect, StaffSelect } from './order-setup-selects'
import type { DesktopMenuContentProps } from '../types'

export function DesktopMenuContent({
  locations,
  selectedLocationId,
  onLocationChange,
  tables,
  selectedTableId,
  onTableChange,
  teamMembers,
  selectedStaffId,
  onStaffChange,
  orderType,
  onOrderTypeChange,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategoryId,
  onCategorySelect,
  isLoadingItems,
  filteredItems,
  itemQuantities,
  recentlyAddedId,
  onItemClick,
  isMobile,
  cartItemsCount,
  cartTotal,
  onShowCart,
  t,
}: DesktopMenuContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar - Location, Table, Staff, Order Type */}
      <div className="p-4 border-b space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <LocationSelect
            locations={locations}
            selectedLocationId={selectedLocationId}
            onLocationChange={onLocationChange}
            t={t}
          />
          <TableSelect
            tables={tables}
            selectedTableId={selectedTableId}
            orderType={orderType}
            onTableChange={onTableChange}
            t={t}
          />
          <StaffSelect
            teamMembers={teamMembers}
            selectedStaffId={selectedStaffId}
            onStaffChange={onStaffChange}
            t={t}
          />
        </div>

        <OrderTypeSelector
          orderType={orderType}
          onOrderTypeChange={onOrderTypeChange}
          t={t}
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchItems')}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
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
      <ScrollArea className="flex-1 p-4">
        <MenuItemsGrid
          items={filteredItems}
          itemQuantities={itemQuantities}
          recentlyAddedId={recentlyAddedId}
          isLoading={isLoadingItems}
          onItemClick={onItemClick}
          t={t}
        />
      </ScrollArea>

      {/* Mobile cart button */}
      {isMobile && cartItemsCount > 0 && (
        <div className="p-4 pb-8 border-t safe-area-pb">
          <Button
            className="w-full h-12"
            onClick={onShowCart}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {t('viewCart')} ({cartItemsCount}) - €{cartTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )
}
