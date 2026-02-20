'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { startNotificationLoop, stopNotificationLoop } from '@/lib/utils/notification-sound'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, Clock, Store, Truck, CheckCheck, CheckCircle, XCircle, ChevronDown, ChevronUp, Table, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTimeElapsed, typeIcons } from './order-card'
import type { OrderWithRelations } from '@/lib/types'

interface NewOrdersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: OrderWithRelations[]
  onViewOrder: (order: OrderWithRelations) => void
  onDismissAll: () => void
  onAcceptOrder?: (orderId: string) => void
  onAcceptAllOrders?: () => void
  onCancelOrder?: (orderId: string) => void
  pendingCount?: number
  isAcceptingAll?: boolean
}

// Skeleton component for loading orders
function OrderSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden animate-pulse">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
        <Skeleton className="h-5 w-5" />
      </div>
    </div>
  )
}

export function NewOrdersModal({
  open,
  onOpenChange,
  orders,
  onDismissAll,
  onAcceptOrder,
  onAcceptAllOrders,
  onCancelOrder,
  pendingCount = 0,
  isAcceptingAll = false,
}: NewOrdersModalProps) {
  const t = useTranslations('ordersPage')
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  // Start/stop notification loop based on modal open state
  useEffect(() => {
    if (open && orders.length > 0) {
      startNotificationLoop()
    } else {
      stopNotificationLoop()
    }
    
    // Cleanup on unmount
    return () => {
      stopNotificationLoop()
    }
  }, [open, orders.length])

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const handleDismissAll = () => {
    onDismissAll()
    onOpenChange(false)
  }

  const handleAcceptOrder = (orderId: string) => {
    onAcceptOrder?.(orderId)
  }

  const handleCancelOrder = (orderId: string) => {
    onCancelOrder?.(orderId)
  }

  // Don't render if no orders
  if (orders.length === 0 && !open) {
    return null
  }

  return (
    <Dialog open={open}>
      <DialogContent hideCloseButton className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>{t('newOrdersTitle') || 'New Orders'}</span>
              <Badge variant="secondary" className="ml-2">
                {orders.length + pendingCount}
              </Badge>
              {pendingCount > 0 && (
                <Loader2 className="h-4 w-4 ml-2 animate-spin text-muted-foreground inline" />
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {t('newOrdersDescription') || 'The following orders have just arrived'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-3">
            {/* Show skeletons for pending orders */}
            {Array.from({ length: pendingCount }).map((_, i) => (
              <OrderSkeleton key={`skeleton-${i}`} />
            ))}
            
            {orders.map((order) => {
              const TypeIcon = typeIcons[order.type] || Store
              const isExpanded = expandedOrders.has(order.id)
              const hasNotes = order.customer_notes || order.items?.some(item => item.notes)

              return (
                <div
                  key={order.id}
                  className="rounded-lg border bg-card overflow-hidden"
                >
                  {/* Header - Always visible */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleExpanded(order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        "bg-secondary"
                      )}>
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            #{order.order_number || order.id.slice(0, 8)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {t(`type.${order.type}`)}
                          </Badge>
                          {order.table && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Table className="h-3 w-3" />
                              {order.table.name}
                            </Badge>
                          )}
                          {hasNotes && (
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                              <MessageSquare className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{order.items?.length || 0} {t('items')}</span>
                          <span>•</span>
                          <span className="font-medium">€{order.total?.toFixed(2) || '0.00'}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeElapsed(order.placed_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                      {/* Order Items */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t('items')}</h4>
                        <div className="space-y-1.5">
                          {order.items?.map((item) => {
                            const variantNames = (item as any).selected_variants?.map((v: any) => v.name) || []
                            
                            return (
                              <div key={item.id} className="flex justify-between items-start text-sm">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{item.quantity}x</span>
                                    <span>{item.item_name}</span>
                                    {item.variant_name && (
                                      <span className="text-muted-foreground">({item.variant_name})</span>
                                    )}
                                  </div>
                                  {variantNames.length > 0 && (
                                    <p className="text-xs text-muted-foreground ml-6">
                                      {variantNames.join(', ')}
                                    </p>
                                  )}
                                  {(item as any).selected_options?.length > 0 && (
                                    <p className="text-xs text-muted-foreground ml-6">
                                      + {(item as any).selected_options.map((o: any) => o.name).join(', ')}
                                    </p>
                                  )}
                                  {item.notes && (
                                    <p className="text-xs text-amber-500 ml-6 flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {item.notes}
                                    </p>
                                  )}
                                  {(item as any).allergens?.length > 0 && (
                                    <p className="text-xs text-red-500 ml-6 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {(item as any).allergens.join(', ')}
                                    </p>
                                  )}
                                </div>
                                <span className="text-muted-foreground shrink-0">
                                  €{item.total_price?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Customer Notes */}
                      {order.customer_notes && (
                        <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                          <div className="flex items-start gap-1.5 text-sm">
                            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                            <div>
                              <p className="font-medium text-amber-500">{t('customerNotes')}</p>
                              <p className="text-muted-foreground">{order.customer_notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-lg font-bold">
                          {t('total')}: €{order.total?.toFixed(2) || '0.00'}
                        </div>
                        <div className="flex items-center gap-2">
                          {onAcceptOrder && (
                            <Button 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleAcceptOrder(order.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('actions.accept') || 'Accept'}
                            </Button>
                          )}
                          {onCancelOrder && (
                            <Button 
                              variant="outline"
                              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('actions.cancel') || 'Cancel'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('close') || 'Close'}
          </Button>
          {onAcceptAllOrders && orders.length > 0 && (
            <Button 
              onClick={onAcceptAllOrders} 
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              disabled={isAcceptingAll}
            >
              {isAcceptingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              {t('actions.acceptAll') || 'Accept All'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
