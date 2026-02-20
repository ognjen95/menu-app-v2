import { Button } from '@/components/ui/button'
import { Store, Package, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderTypeSelectorProps, OrderType } from '../types'

export function OrderTypeSelector({
  orderType,
  onOrderTypeChange,
  t,
}: OrderTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={orderType === 'dine_in' ? 'default' : 'outline'}
        size="lg"
        onClick={() => onOrderTypeChange('dine_in')}
        className="flex-1"
      >
        <Store className="h-4 w-4 mr-2" />
        {t('dineIn')}
      </Button>
      <Button
        variant={orderType === 'takeaway' ? 'default' : 'outline'}
        size="lg"
        onClick={() => onOrderTypeChange('takeaway')}
        className="flex-1"
      >
        <Package className="h-4 w-4 mr-2" />
        {t('takeaway')}
      </Button>
      <Button
        variant={orderType === 'delivery' ? 'default' : 'outline'}
        size="lg"
        onClick={() => onOrderTypeChange('delivery')}
        className="flex-1"
      >
        <Truck className="h-4 w-4 mr-2" />
        {t('delivery')}
      </Button>
    </div>
  )
}

// Mobile version with bigger buttons
export function OrderTypeSelectorMobile({
  orderType,
  onOrderTypeChange,
  t,
}: OrderTypeSelectorProps) {
  const types: { type: OrderType; icon: typeof Store; label: string }[] = [
    { type: 'dine_in', icon: Store, label: t('dineIn') },
    { type: 'takeaway', icon: Package, label: t('takeaway') },
    { type: 'delivery', icon: Truck, label: t('delivery') },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {types.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onOrderTypeChange(type)}
          className={cn(
            "p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all",
            orderType === type
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/50"
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}
