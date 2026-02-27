import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, Settings2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuItemCardProps } from '../types'

export function MenuItemCard({
  item,
  quantity,
  isHighlighted,
  onItemClick,
  onQuantityChange,
  onRemoveOne,
  t,
}: MenuItemCardProps) {
  const isSelected = quantity > 0
  const hasVariants = item.menu_item_variants && item.menu_item_variants.length > 0

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl text-left transition-all",
        "border-2 border-transparent",
        isSelected && "border-primary bg-primary/10",
        isHighlighted && "ring-2 ring-primary/50",
        item.is_sold_out && "opacity-50"
      )}
    >
      {isHighlighted && (
        <span className="absolute inset-0 rounded-xl border-2 border-primary/30 animate-ping pointer-events-none" />
      )}
      
      {/* Main clickable area */}
      <button
        onClick={() => onItemClick(item)}
        disabled={item.is_sold_out}
        className={cn(
          "flex gap-2 p-2 pb-0 text-left transition-all",
          "hover:bg-muted/50 active:scale-[0.98]",
          item.is_sold_out && "cursor-not-allowed"
        )}
      >
        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
          {item.image_urls && item.image_urls[0] ? (
            <Image
              src={item.image_urls[0]}
              alt={item.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="font-medium text-sm line-clamp-2">{item.name}</span>
          <span className="font-semibold text-sm text-primary">€{item.base_price.toFixed(2)}</span>
        </div>
      </button>
      
      {/* Quantity controls row - only shown when selected */}
      {isSelected && (
        <div className="flex items-center justify-between h-6 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              if (hasVariants) {
                onRemoveOne(item.id)
              } else {
                onQuantityChange(item.id, -1)
              }
            }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="font-bold text-xs">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              if (hasVariants) {
                onItemClick(item) // Opens variant picker
              } else {
                onQuantityChange(item.id, 1)
              }
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {item.is_sold_out && (
        <Badge variant="destructive" className="absolute top-1 right-1 text-xs">
          {t('soldOut')}
        </Badge>
      )}
      
      {!item.is_sold_out && hasVariants && (
        <Badge variant="secondary" className="absolute top-1 right-1 text-[10px] px-1.5 py-0">
          <Settings2 className="h-2.5 w-2.5 mr-0.5" />
          {t('hasVariants')}
        </Badge>
      )}
    </div>
  )
}
