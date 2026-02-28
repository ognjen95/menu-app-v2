import { CompactMenuItemsGridSkeleton } from '@/components/ui/skeletons'
import { MenuItemCard } from './menu-item-card'
import type { MenuItemsGridProps } from '../types'

export function MenuItemsGrid({
  items,
  itemQuantities,
  recentlyAddedId,
  isLoading,
  onItemClick,
  onQuantityChange,
  onRemoveOne,
  t,
}: MenuItemsGridProps) {
  if (isLoading) {
    return <CompactMenuItemsGridSkeleton count={8} />
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
      {items.map(item => (
        <MenuItemCard
          key={item.id}
          item={item}
          quantity={itemQuantities[item.id] || 0}
          isHighlighted={recentlyAddedId === item.id}
          onItemClick={onItemClick}
          onQuantityChange={onQuantityChange}
          onRemoveOne={onRemoveOne}
          t={t}
        />
      ))}
      {items.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          {t('noItemsFound')}
        </div>
      )}
    </div>
  )
}
