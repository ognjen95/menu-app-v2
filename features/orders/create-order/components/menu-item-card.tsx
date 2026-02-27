import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { UtensilsCrossed, Settings2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuItemCardProps } from '../types'

export function MenuItemCard({
  item,
  quantity,
  isHighlighted,
  onItemClick,
  t,
}: MenuItemCardProps) {
  const isSelected = quantity > 0

  return (
    <button
      onClick={() => onItemClick(item)}
      disabled={item.is_sold_out}
      className={cn(
        "relative flex gap-3 p-2 rounded-xl text-left transition-all",
        "border-2 border-transparent",
        "hover:bg-muted/50 active:scale-[0.98]",
        isSelected && "border-primary bg-primary/10",
        isHighlighted && "ring-2 ring-primary/50",
        item.is_sold_out && "opacity-50 cursor-not-allowed"
      )}
    >
      {isHighlighted && (
        <span className="absolute inset-0 rounded-xl border-2 border-primary/30 animate-ping pointer-events-none" />
      )}
      
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
        <span className="font-medium text-sm line-clamp-1">{item.name}</span>
        <span className="font-semibold text-sm text-primary">€{item.base_price.toFixed(2)}</span>
      </div>
      
      {item.is_sold_out && (
        <Badge variant="destructive" className="absolute top-1 right-1 text-xs">
          {t('soldOut')}
        </Badge>
      )}
      
      {!item.is_sold_out && item.menu_item_variants && item.menu_item_variants.length > 0 && (
        <Badge variant="secondary" className="absolute top-1 right-1 text-[10px] px-1.5 py-0">
          <Settings2 className="h-2.5 w-2.5 mr-0.5" />
          {t('hasVariants')}
        </Badge>
      )}
      
      {isSelected && (
        <div className="absolute bottom-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {quantity}
        </div>
      )}
    </button>
  )
}
