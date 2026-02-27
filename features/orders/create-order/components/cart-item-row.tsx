import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItemRowProps } from '../types'

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 bg-background p-3 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.menuItem.name}</p>
        {item.selectedVariants && item.selectedVariants.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {item.selectedVariants.map(v => v.name).join(', ')}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          €{(item.calculatedPrice * item.quantity).toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => onUpdateQuantity(item.id, -1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => onUpdateQuantity(item.id, 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 text-destructive ml-5"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
