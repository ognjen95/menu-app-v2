'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Bell,
  Truck,
  Store,
  Table,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MessageSquare,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithRelations } from '@/lib/types'

export const statusConfig: Record<OrderStatus, { label: string; color: string; badgeColor: string; buttonColor: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-500', badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', buttonColor: 'bg-gray-500 hover:bg-gray-600 text-white', icon: Clock },
  placed: { label: 'New', color: 'bg-blue-500', badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', buttonColor: 'bg-blue-500 hover:bg-blue-600 text-white', icon: Bell },
  accepted: { label: 'Accepted', color: 'bg-indigo-500', badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', buttonColor: 'bg-indigo-500 hover:bg-indigo-600 text-white', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-yellow-500', badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', buttonColor: 'bg-yellow-500 hover:bg-yellow-600 text-white', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500', badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', buttonColor: 'bg-green-500 hover:bg-green-600 text-white', icon: Bell },
  served: { label: 'Served', color: 'bg-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', buttonColor: 'bg-emerald-500 hover:bg-emerald-600 text-white', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-gray-500', badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', buttonColor: 'bg-gray-500 hover:bg-gray-600 text-white', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', buttonColor: 'bg-red-500 hover:bg-red-600 text-white', icon: XCircle },
}

export const typeIcons: Record<string, React.ElementType> = {
  dine_in: Store,
  takeaway: Store,
  delivery: Truck,
}

export function formatTimeElapsed(placedAt: string | null): string {
  if (!placedAt) return ''
  const minutes = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export function getTimerColor(placedAt: string | null): string {
  if (!placedAt) return 'text-muted-foreground'
  const minutes = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000)
  if (minutes < 10) return 'text-green-500'
  if (minutes < 20) return 'text-yellow-500'
  return 'text-red-500'
}

interface OrderCardProps {
  order: OrderWithRelations
  onSelect: (order: OrderWithRelations) => void
  onComplete?: (orderId: string) => void
  onCancel?: (orderId: string) => void
}

export function OrderCard({ order, onSelect, onComplete, onCancel }: OrderCardProps) {
  const t = useTranslations('ordersPage')
  const [isExpanded, setIsExpanded] = useState(false)
  const StatusIcon = statusConfig[order.status]?.icon || Clock
  const TypeIcon = typeIcons[order.type] || Store
  const timerColor = getTimerColor(order.placed_at)

  // Check if there's additional info to show
  const hasNotes = order.customer_notes || order.items?.some(item => item.notes)
  const hasAllergens = order.items?.some(item => (item as any).allergens?.length > 0)
  const hasOptions = order.items?.some(item => (item as any).selected_options?.length > 0)
  const hasAdditionalInfo = hasNotes || hasAllergens || hasOptions

  return (
    <Card
      className={cn(
        "relative overflow-hidden cursor-pointer hover:scale-95 hover:shadow-lg hover:shadow-primary/50 hover:opacity-90 transition-all",
        // order.status === 'placed' && 'ring-2 ring-red-500/50'
      )}
      onClick={() => onSelect(order)}
    >
      {/* Status indicator bar */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        statusConfig[order.status]?.color,
        (order.status === 'ready' || order.status === 'placed') && 'animate-pulse',
      )} />

      {/* Pulsing urgent indicator for new orders */}
      {order.status === 'placed' && (
        <div className="absolute top-2 right-2 z-10">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base font-bold shrink-0">{order.order_number}</span>
            <Badge variant="outline" className="gap-0.5 text-xs px-1.5 shrink-0">
              <TypeIcon className="h-3 w-3" />
              {t(`type.${order.type}`)}
            </Badge>
          </div>
          <span className={cn("font-mono text-xs shrink-0", timerColor)}>
            {formatTimeElapsed(order.placed_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {order.table_id && (
            <Badge variant="secondary" className="flex items-center gap-0.5 text-xs px-1.5">
              <Table className="h-2.5 w-2.5" />
              {order.table?.zone && `${order.table.zone} - `}{order.table?.name}
            </Badge>
          )}

        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Order items */}
        <div className="space-y-1.5 text-sm">
          {(isExpanded ? order.items : order.items?.slice(0, 3))?.map((item) => {
            // Get variant names for display
            const variantNames = (item as any).selected_variants?.map((v: any) => v.name) || []
            const hasVariants = item.variant_name || variantNames.length > 0

            return (
              <div key={item.id} className="space-y-0.5">
                <div className="flex justify-between">
                  <div className="truncate">
                    <span className="font-medium">{item.quantity}x {item.item_name}</span>
                    {/* Show variants inline when collapsed */}
                    {!isExpanded && hasVariants && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({item.variant_name || variantNames.join(', ')})
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground shrink-0 ml-2">
                    €{item.total_price?.toFixed(2) || '0.00'}
                  </span>
                </div>

                {/* Expanded item details */}
                {isExpanded && (
                  <div className="pl-4 space-y-0.5">
                    {/* Variant (old system) */}
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant_name}
                      </p>
                    )}

                    {/* Selected variants (new system) */}
                    {(item as any).selected_variants?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {(item as any).selected_variants.map((v: any, i: number) => (
                          <span key={i}>
                            {v.name}{v.price_adjustment !== 0 && ` (${v.price_adjustment > 0 ? '+' : ''}€${v.price_adjustment.toFixed(2)})`}
                            {i < (item as any).selected_variants.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Options */}
                    {(item as any).selected_options?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {(item as any).selected_options.map((opt: any, i: number) => (
                          <span key={i}>
                            {opt.name}{opt.price > 0 && ` (+€${opt.price.toFixed(2)})`}
                            {i < (item as any).selected_options.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Item notes */}
                    {item.notes && (
                      <div className="flex items-start gap-1 text-xs text-amber-500">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{item.notes}</span>
                      </div>
                    )}

                    {/* Allergens */}
                    {(item as any).allergens?.length > 0 && (
                      <div className="flex items-start gap-1 text-xs text-red-500">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{(item as any).allergens.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Show more items indicator (collapsed) */}
          {!isExpanded && (order.items?.length || 0) > 3 && (
            <div className="text-muted-foreground text-xs">
              {t('moreItems', { count: (order.items?.length || 0) - 3 })}
            </div>
          )}
        </div>

        {/* Customer notes (expanded) */}
        {isExpanded && order.customer_notes && (
          <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
            <div className="flex items-start gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-amber-500">{t('customerNotes')}</p>
                <p className="text-muted-foreground">{order.customer_notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse button */}
        {(hasAdditionalInfo || (order.items?.length || 0) > 3) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded)
            }}
            className="w-full h-6 text-xs text-muted-foreground hover:text-foreground "
          >
            {hasAdditionalInfo && (
              <Badge variant="outline" className="flex items-center gap-2 text-xs px-1.5 text-amber-500 border-none">
                <Info className="h-2.5 w-2.5" />
                {t('hasNotes')}
              </Badge>
            )}


            {/* <span className="text-xs">
              {isExpanded ? t('collapse') : t('expand')}
            </span> */}
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 font-bold" />
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 font-bold" />
              </>
            )}

          </Button>
        )}

        {/* Total and status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <span className="text-lg font-bold">
              €{order.total?.toFixed(2) || '0.00'}
            </span>
          </div>
          <Badge className={statusConfig[order.status]?.badgeColor}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(`status.${order.status}`)}
          </Badge>
        </div>

        {/* Action buttons for served orders */}
        {order.status === 'served' && (onComplete || onCancel) && (
          <div className="flex gap-2 pt-2">
            {onComplete && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onComplete(order.id)
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {t('actions.complete')}
              </Button>
            )}
            {onCancel && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel(order.id)
                }}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                {t('actions.cancel')}
              </Button>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
