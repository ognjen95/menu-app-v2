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
  return (
    <button
      onClick={() => onItemClick(item)}
      disabled={item.is_sold_out}
      className={cn(
        "relative flex gap-3 p-3 rounded-lg border text-left transition-all",
        "hover:border-primary hover:shadow-sm active:scale-[0.98]",
        quantity > 0 && "border-primary/40 bg-primary/5",
        isHighlighted && "ring-2 ring-primary/50",
        item.is_sold_out && "opacity-50 cursor-not-allowed"
      )}
    >
      {isHighlighted && (
        <span className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-ping pointer-events-none" />
      )}
      
      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
        {item.image_urls && item.image_urls[0] ? (
          <Image
            src={item.image_urls[0]}
            alt={item.name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm line-clamp-2">{item.name}</span>
        <span className="text-xs text-muted-foreground block">
          {item.category?.name}
        </span>
        <span className="font-semibold text-sm">€{item.base_price.toFixed(2)}</span>
      </div>
      
      {item.is_sold_out && (
        <Badge variant="destructive" className="absolute top-1 right-1 text-xs">
          {t('soldOut')}
        </Badge>
      )}
      
      {!item.is_sold_out && item.menu_item_variants && item.menu_item_variants.length > 0 && (
        <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
          <Settings2 className="h-3 w-3 mr-0.5" />
          {t('hasVariants')}
        </Badge>
      )}
      
      {quantity > 0 && (
        <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold shadow">
          <Check className="h-3 w-3" />x{quantity}
        </div>
      )}
    </button>
  )
}
