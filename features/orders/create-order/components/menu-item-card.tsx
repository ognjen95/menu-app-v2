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
        "relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all isolate",
        // "ring-2 ring-transparent",
        isSelected && "ring-primary ring-offset-2 ring-offset-background",
        isHighlighted && "ring-primary/50",
        item.is_sold_out && "opacity-50 cursor-not-allowed"
      )}
    >
      {isHighlighted && (
        <span className="absolute inset-0 rounded-xl border-2 border-primary/30 animate-ping pointer-events-none z-20" />
      )}

      {/* Full image background */}
      <button
        onClick={() => onItemClick(item)}
        disabled={item.is_sold_out}
        className="absolute inset-0 w-full h-full overflow-hidden rounded-xl"
      >
        {item.image_urls && item.image_urls[0] ? (
          <Image
            src={item.image_urls[0]}
            alt={item.name}
            fill
            className="object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <UtensilsCrossed className="h-10 w-10" />
          </div>
        )}
      </button>

      {/* Price badge - top left */}
      <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground font-bold h-7 rounded-full flex items-center justify-center px-2 shadow-lg text-sm">
        €{item.base_price.toFixed(2)}
      </div>

      {/* Bottom bar - text and controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-muted/50 backdrop-blur rounded-b-xl">
        {/* Text content */}
        <div className="flex-1 min-w-0 text-white pr-2">
          <p className="font-semibold leading-tight line-clamp-2">{item.name}</p>
        </div>

        {/* Quantity controls */}
        {!!quantity && (
          <div className="flex items-center gap-1 shrink-0 bg-secondary rounded-full border">
            <Button
              size="icon"
              variant={'secondary'}
              className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                if (hasVariants) {
                  onRemoveOne(item.id)
                } else {
                  onQuantityChange(item.id, -1)
                }
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-bold text-white text-sm min-w-[20px] text-center">{quantity}</span>
            <Button
              size="icon"
              variant={'secondary'}
              className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                if (hasVariants) {
                  onItemClick(item)
                } else {
                  onQuantityChange(item.id, 1)
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sold out badge */}
      {item.is_sold_out && (
        <Badge variant="destructive" className="absolute top-2 right-2 z-10">
          {t('soldOut')}
        </Badge>
      )}

      {/* Variants badge */}
      {!item.is_sold_out && hasVariants && !isSelected && (
        <Badge className="absolute top-2 right-2 z-10 bg-black/60 text-white border-0 text-[10px] px-1.5">
          <Settings2 className="h-3 w-3 mr-0.5" />
          {t('hasVariants')}
        </Badge>
      )}
    </div>
  )
}
